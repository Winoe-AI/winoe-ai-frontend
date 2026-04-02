import { scheduleCandidateSession } from '@/features/candidate/session/api/scheduleApi';
import type { CandidateSessionScheduleParams } from './useCandidateSessionSchedule.types';

type Params = Pick<
  CandidateSessionScheduleParams,
  'token' | 'session' | 'bootstrap'
> & {
  scheduledStartAtUtc: string;
  timezoneValue: string;
  clearScheduleErrors: () => void;
};

export async function submitCandidateSchedule({
  token,
  session,
  bootstrap,
  scheduledStartAtUtc,
  timezoneValue,
  clearScheduleErrors,
}: Params) {
  const response = await scheduleCandidateSession(token, {
    scheduledStartAt: scheduledStartAtUtc,
    candidateTimezone: timezoneValue,
  });

  session.setBootstrap({
    candidateSessionId: response.candidateSessionId,
    status: bootstrap?.status ?? 'in_progress',
    simulation: bootstrap?.simulation ?? { title: '', role: '' },
    aiNoticeText: bootstrap?.aiNoticeText ?? '',
    aiNoticeVersion: bootstrap?.aiNoticeVersion ?? 'mvp1',
    evalEnabledByDay: bootstrap?.evalEnabledByDay ?? {},
    scheduledStartAt: response.scheduledStartAt,
    candidateTimezone: response.candidateTimezone,
    dayWindows: response.dayWindows,
    scheduleLockedAt: response.scheduleLockedAt,
    currentDayWindow: null,
  });
  clearScheduleErrors();

  return response;
}
