import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';

export function normalizeDayWindows(
  dayWindows: CandidateDayWindow[] | undefined | null,
): CandidateDayWindow[] {
  if (!Array.isArray(dayWindows)) return [];
  return [...dayWindows].sort((a, b) => a.dayIndex - b.dayIndex);
}

export function firstWindowStartAt(
  params:
    | {
        scheduledStartAt?: string | null;
        dayWindows?: CandidateDayWindow[] | null;
        currentDayWindow?: CandidateCurrentDayWindow | null;
      }
    | null
    | undefined,
) {
  if (!params) return null;
  const currentStart = params.currentDayWindow?.windowStartAt;
  if (currentStart) return currentStart;
  const windows = normalizeDayWindows(params.dayWindows);
  if (windows[0]?.windowStartAt) return windows[0].windowStartAt;
  return params.scheduledStartAt ?? null;
}

type ScheduleFields = {
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[] | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export function hasScheduleConfigured(
  bootstrap: ScheduleFields | null | undefined,
): boolean {
  if (!bootstrap) return false;
  if (!bootstrap.scheduledStartAt || !bootstrap.candidateTimezone) return false;
  return normalizeDayWindows(bootstrap.dayWindows).length > 0;
}

export function isScheduleLocked(
  bootstrap: ScheduleFields | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!hasScheduleConfigured(bootstrap)) return false;
  const target = firstWindowStartAt(bootstrap);
  if (!target) return false;
  const targetMs = Date.parse(target);
  if (!Number.isFinite(targetMs)) return false;
  return nowMs < targetMs;
}
