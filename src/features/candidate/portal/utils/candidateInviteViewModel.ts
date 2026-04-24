import type { CandidateInvite } from '@/features/candidate/session/api';
import type { StatusPillTone } from '@/shared/status/types';
import { resolveNowMs } from '@/shared/time/now';

export const TRIAL_DAY_COUNT = 5;

export type CandidatePortalTrialState =
  | 'invited'
  | 'awaiting_start_date'
  | 'scheduled'
  | 'day_open'
  | 'day_closed'
  | 'complete'
  | 'report_ready'
  | 'expired'
  | 'terminated';

export type NormalizedTrialProgress = {
  completed: number;
  total: number;
};

type CandidateInviteLike = Pick<
  CandidateInvite,
  | 'status'
  | 'progress'
  | 'scheduledStartAt'
  | 'dayWindows'
  | 'currentDayWindow'
  | 'scheduleLockedAt'
  | 'completedAt'
  | 'reportReady'
  | 'hasReport'
  | 'terminatedAt'
  | 'isExpired'
  | 'isTerminated'
>;

const normalizeStatus = (status: string | null | undefined) =>
  (status ?? '').toString().trim().toLowerCase();

const normalizeEmail = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

const clampDayCount = (value: number) =>
  Math.max(0, Math.min(TRIAL_DAY_COUNT, Math.round(value)));

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function normalizeTrialProgress(
  progress: CandidateInvite['progress'],
): NormalizedTrialProgress | null {
  if (!progress) return null;

  const raw = progress as Record<string, unknown>;
  const completedFromIds = Array.isArray(raw.completedTaskIds)
    ? raw.completedTaskIds.length
    : null;
  const completedValue =
    raw.completed ?? raw.completedTasks ?? raw.completed_tasks;
  const totalValue = raw.total ?? raw.totalTasks ?? raw.total_tasks;
  const parsedCompleted =
    typeof completedValue === 'number'
      ? completedValue
      : typeof completedValue === 'string'
        ? Number(completedValue)
        : completedFromIds;
  const parsedTotal =
    typeof totalValue === 'number'
      ? totalValue
      : typeof totalValue === 'string'
        ? Number(totalValue)
        : null;

  const hasCompleted =
    typeof parsedCompleted === 'number' && Number.isFinite(parsedCompleted);
  const hasTotal =
    typeof parsedTotal === 'number' &&
    Number.isFinite(parsedTotal) &&
    parsedTotal > 0;
  if (!hasCompleted && !hasTotal) return null;
  if (
    totalValue !== null &&
    typeof totalValue !== 'undefined' &&
    (!hasTotal || (parsedTotal as number) <= 0)
  ) {
    return null;
  }

  const completed = hasCompleted ? clampDayCount(parsedCompleted as number) : 0;

  return {
    completed: Math.min(completed, TRIAL_DAY_COUNT),
    total: TRIAL_DAY_COUNT,
  };
}

export function isCompletedInvite(invite: CandidateInviteLike): boolean {
  return (
    normalizeStatus(invite.status) === 'completed' || invite.completedAt != null
  );
}

export function normalizeCandidateInviteEmail(
  invite: CandidateInvite,
): string | null {
  return normalizeEmail(invite.candidateEmail ?? invite.inviteEmail);
}

export function inviteMatchesSignedInEmail(
  invite: CandidateInvite,
  signedInEmail: string | null | undefined,
): boolean {
  const expected = normalizeEmail(signedInEmail);
  if (!expected) return true;
  const inviteEmail = normalizeCandidateInviteEmail(invite);
  if (!inviteEmail) return true;
  return inviteEmail === expected;
}

export function filterCandidateInvitesForViewer(
  invites: CandidateInvite[],
  signedInEmail: string | null | undefined,
): CandidateInvite[] {
  const filtered = invites.filter((invite) =>
    inviteMatchesSignedInEmail(invite, signedInEmail),
  );
  const seen = new Set<number>();
  return filtered.filter((invite) => {
    if (seen.has(invite.candidateSessionId)) return false;
    seen.add(invite.candidateSessionId);
    return true;
  });
}

export function isReviewReadyInvite(invite: CandidateInviteLike): boolean {
  return invite.reportReady === true || invite.hasReport === true;
}

export function isReviewRouteInvite(invite: CandidateInviteLike): boolean {
  return isCompletedInvite(invite) || isReviewReadyInvite(invite);
}

export function isTerminatedInvite(invite: CandidateInviteLike): boolean {
  return invite.isTerminated === true || invite.terminatedAt != null;
}

export function deriveCandidateInviteState(
  invite: CandidateInviteLike,
  nowMs = resolveNowMs(),
): {
  state: CandidatePortalTrialState;
  statusLabel: string;
  statusTone: StatusPillTone;
  currentDayIndex: number;
  currentDayLabel: string;
  progress: NormalizedTrialProgress | null;
  actionLabel: string;
  actionDisabled: boolean;
} {
  const progress = normalizeTrialProgress(invite.progress);
  const rawStatus = normalizeStatus(invite.status);
  const reviewReady = isReviewReadyInvite(invite);
  const terminated = isTerminatedInvite(invite);
  const completed = isCompletedInvite(invite);
  const currentDayIndex =
    invite.currentDayWindow?.dayIndex ??
    (completed || reviewReady || terminated
      ? TRIAL_DAY_COUNT
      : progress?.completed
        ? Math.min(progress.completed + 1, TRIAL_DAY_COUNT)
        : 1);
  const scheduledStartMs = parseDateMs(invite.scheduledStartAt);
  const firstWindowStartMs = parseDateMs(
    invite.currentDayWindow?.windowStartAt ??
      invite.dayWindows?.[0]?.windowStartAt,
  );
  const hasSchedule =
    Boolean(invite.scheduleLockedAt) ||
    Boolean(scheduledStartMs) ||
    Boolean(invite.dayWindows?.length) ||
    Boolean(invite.currentDayWindow);

  let state: CandidatePortalTrialState = 'invited';
  if (invite.isExpired === true || rawStatus === 'expired') {
    state = 'expired';
  } else if (terminated) {
    state = 'terminated';
  } else if (reviewReady) {
    state = 'report_ready';
  } else if (completed) {
    state = 'complete';
  } else if (invite.currentDayWindow?.state === 'active') {
    state = 'day_open';
  } else if (invite.currentDayWindow?.state === 'closed') {
    state = 'day_closed';
  } else if (invite.currentDayWindow?.state === 'upcoming') {
    state = 'scheduled';
  } else if (progress?.completed && progress.completed > 0) {
    state = 'day_open';
  } else if (hasSchedule) {
    if (
      scheduledStartMs !== null &&
      nowMs < scheduledStartMs &&
      !invite.dayWindows?.length
    ) {
      state = 'awaiting_start_date';
    } else if (
      firstWindowStartMs !== null &&
      nowMs < firstWindowStartMs &&
      !invite.currentDayWindow
    ) {
      state = 'scheduled';
    } else {
      state = 'scheduled';
    }
  } else if (rawStatus === 'in_progress') {
    state = 'scheduled';
  }

  const statusByState: Record<
    CandidatePortalTrialState,
    { label: string; tone: StatusPillTone }
  > = {
    invited: { label: 'Invited', tone: 'muted' },
    awaiting_start_date: { label: 'Awaiting start date', tone: 'info' },
    scheduled: { label: 'Scheduled', tone: 'info' },
    day_open: { label: `Day ${currentDayIndex} open`, tone: 'success' },
    day_closed: { label: `Day ${currentDayIndex} closed`, tone: 'warning' },
    complete: { label: 'Complete', tone: 'success' },
    report_ready: { label: 'Report ready', tone: 'success' },
    expired: { label: 'Expired', tone: 'warning' },
    terminated: { label: 'Terminated', tone: 'warning' },
  };

  const actionLabel =
    state === 'expired'
      ? 'Expired'
      : state === 'terminated'
        ? 'Ended'
        : state === 'invited'
          ? 'Start trial'
          : state === 'complete' || state === 'report_ready'
            ? 'Review submissions'
            : 'Continue trial';

  return {
    state,
    statusLabel: statusByState[state].label,
    statusTone: statusByState[state].tone,
    currentDayIndex,
    currentDayLabel: `Day ${currentDayIndex} of ${TRIAL_DAY_COUNT}`,
    progress,
    actionLabel,
    actionDisabled: state === 'terminated' || state === 'expired',
  };
}
