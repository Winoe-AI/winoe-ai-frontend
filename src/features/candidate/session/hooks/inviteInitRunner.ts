import {
  resolveCandidateInviteToken,
  type CandidateSessionBootstrapResponse,
} from '@/features/candidate/api';
import {
  INVITE_EXPIRED_MESSAGE,
  INVITE_UNAVAILABLE_MESSAGE,
} from '@/lib/copy/invite';
import {
  friendlyBootstrapError,
  friendlyTaskError,
} from '../utils/errorMessages';
import { hasScheduleConfigured, isScheduleLocked } from '../utils/schedule';
import type { ViewState } from '../CandidateSessionView';

export type InviteInitParams = {
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateSessionBootstrapResponse) => void;
  clearTaskError: () => void;
  setView: (v: ViewState) => void;
  setAuthMessage: (m: string | null) => void;
  setErrorMessage: (m: string | null) => void;
  setErrorStatus: (s: number | null) => void;
  redirectToLogin: () => void;
  fetchTask: (opts?: { sessionId?: number }) => Promise<void>;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};

export const inviteErrorCopy = (status: number | null, msg: string | null) =>
  msg ?? (status === 410 ? INVITE_EXPIRED_MESSAGE : INVITE_UNAVAILABLE_MESSAGE);

const hasSchedulePayload = (resp: CandidateSessionBootstrapResponse): boolean =>
  'scheduledStartAt' in resp ||
  'candidateTimezone' in resp ||
  'dayWindows' in resp ||
  'scheduleLockedAt' in resp;

export function createInviteInit(params: InviteInitParams) {
  const runInit = async (initToken: string, allowRetry = false) => {
    if (!initToken) {
      params.setErrorMessage(INVITE_UNAVAILABLE_MESSAGE);
      params.setErrorStatus(400);
      params.setView('error');
      return;
    }

    params.setView('loading');
    params.setErrorMessage(null);
    params.setErrorStatus(null);
    params.setAuthMessage(null);
    params.markStart('candidate:init');
    try {
      const resp = await resolveCandidateInviteToken(initToken, {
        skipCache: allowRetry,
      });
      params.setCandidateSessionId(resp.candidateSessionId);
      params.setBootstrap({
        candidateSessionId: resp.candidateSessionId,
        status: resp.status,
        simulation: resp.simulation,
        scheduledStartAt: resp.scheduledStartAt ?? null,
        candidateTimezone: resp.candidateTimezone ?? null,
        dayWindows: resp.dayWindows ?? [],
        scheduleLockedAt: resp.scheduleLockedAt ?? null,
        currentDayWindow: resp.currentDayWindow ?? null,
      });
      params.clearTaskError();
      if (resp.status === 'expired') {
        params.setErrorStatus(410);
        params.setErrorMessage(INVITE_EXPIRED_MESSAGE);
        params.setView('expired');
        params.markEnd('candidate:init', { status: 'expired' });
        return;
      }
      if (!hasScheduleConfigured(resp) && hasSchedulePayload(resp)) {
        params.setView('scheduling');
        params.markEnd('candidate:init', { status: 'schedule_required' });
        return;
      }
      if (isScheduleLocked(resp)) {
        params.setView('locked');
        params.markEnd('candidate:init', { status: 'locked' });
        return;
      }
      params.setView('starting');
      params.markEnd('candidate:init', { status: 'success' });
      await params
        .fetchTask({ sessionId: resp.candidateSessionId })
        .then(() => params.setView('running'))
        .catch((err) => {
          params.setErrorMessage(friendlyTaskError(err));
          params.setView('error');
        });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        params.markEnd('candidate:init', { status: 'auth_redirect' });
        params.redirectToLogin();
      } else if (status === 403) {
        params.setErrorStatus(403);
        params.setErrorMessage(friendlyBootstrapError(err));
        params.setView('accessDenied');
        params.markEnd('candidate:init', { status: 'access_denied' });
      } else if (status === 410) {
        params.setErrorStatus(410);
        params.setErrorMessage(friendlyBootstrapError(err));
        params.setView('expired');
        params.markEnd('candidate:init', { status: 'expired' });
      } else {
        params.setErrorStatus(status ?? null);
        params.setErrorMessage(friendlyBootstrapError(err));
        params.setView('error');
        params.markEnd('candidate:init', { status: 'error' });
      }
    }
  };

  return runInit;
}
