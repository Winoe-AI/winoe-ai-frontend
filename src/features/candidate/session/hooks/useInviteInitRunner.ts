import { resolveCandidateInviteToken } from '@/features/candidate/session/api';
import type { CandidateSessionBootstrapResponse } from '@/features/candidate/session/api/typesApi';
import {
  INVITE_EXPIRED_MESSAGE,
  INVITE_UNAVAILABLE_MESSAGE,
} from '@/platform/copy/invite';
import {
  hasScheduleConfigured,
  isScheduleLocked,
} from '../utils/scheduleUtils';
import { handleInviteInitError } from './useInviteInitRunner.error';
import type { InviteInitParams } from './useInviteInitRunner.types';

export type { InviteInitParams } from './useInviteInitRunner.types';

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
        trial: resp.trial,
        aiNoticeText: resp.aiNoticeText,
        aiNoticeVersion: resp.aiNoticeVersion,
        evalEnabledByDay: resp.evalEnabledByDay,
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
      params.setView('running');
      params.markEnd('candidate:init', { status: 'success' });
    } catch (err) {
      handleInviteInitError(params, err);
    }
  };

  return runInit;
}
