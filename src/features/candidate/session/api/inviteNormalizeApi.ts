import {
  toCandidateSessionId,
  toDateString,
  toNumberOrNull,
  toStringOrNull,
} from './baseApi';
import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
  CandidateInvite,
} from './typesApi';
import { extractInviteToken } from '@/features/candidate/portal/utils/inviteTokensUtils';
import { TRIAL_DAY_COUNT } from '@/features/candidate/portal/utils/candidateInviteViewModel';

const CANONICAL_CANDIDATE_SESSION_STATUSES = new Set([
  'not_started',
  'in_progress',
  'completed',
  'expired',
]);

const normalizeProgress = (
  raw: unknown,
): { completed: number; total: number } | null => {
  if (raw === null || typeof raw === 'undefined') return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return {
      completed: Math.max(0, Math.min(TRIAL_DAY_COUNT, Math.round(raw))),
      total: TRIAL_DAY_COUNT,
    };
  }
  if (typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const completedFromIds = Array.isArray(rec.completedTaskIds)
    ? rec.completedTaskIds.length
    : null;
  const completed =
    toNumberOrNull(rec.completed) ??
    toNumberOrNull(rec.completedTasks) ??
    toNumberOrNull(rec.completed_tasks) ??
    completedFromIds;
  const total =
    toNumberOrNull(rec.total) ??
    toNumberOrNull(rec.totalTasks) ??
    toNumberOrNull(rec.total_tasks);
  if (completed === null && total === null) return null;
  return {
    completed: Math.max(
      0,
      Math.min(TRIAL_DAY_COUNT, Math.round(completed ?? 0)),
    ),
    total: TRIAL_DAY_COUNT,
  };
};

const normalizeDayWindows = (raw: unknown): CandidateDayWindow[] | null => {
  if (!Array.isArray(raw)) return null;
  const windows = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const rec = item as Record<string, unknown>;
      const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
      const windowStartAt =
        toDateString(rec.windowStartAt) ?? toDateString(rec.window_start_at);
      const windowEndAt =
        toDateString(rec.windowEndAt) ?? toDateString(rec.window_end_at);
      if (!dayIndex || !windowStartAt || !windowEndAt) return null;
      return { dayIndex, windowStartAt, windowEndAt };
    })
    .filter((window): window is CandidateDayWindow => Boolean(window));
  return windows.length ? windows.sort((a, b) => a.dayIndex - b.dayIndex) : [];
};

const normalizeCurrentDayWindow = (
  raw: unknown,
): CandidateCurrentDayWindow | null => {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  const windowStartAt =
    toDateString(rec.windowStartAt) ?? toDateString(rec.window_start_at);
  const windowEndAt =
    toDateString(rec.windowEndAt) ?? toDateString(rec.window_end_at);
  const state = toStringOrNull(rec.state);
  if (!dayIndex || !windowStartAt || !windowEndAt || !state) return null;
  if (state !== 'upcoming' && state !== 'active' && state !== 'closed')
    return null;
  return { dayIndex, windowStartAt, windowEndAt, state };
};

export function normalizeCandidateInvite(raw: unknown): CandidateInvite {
  const rec = (raw ?? {}) as Record<string, unknown>;
  const candidateSessionId = toCandidateSessionId(
    rec.candidateSessionId ?? rec.candidate_session_id ?? rec.id,
  );
  const candidateEmail =
    toStringOrNull(rec.candidateEmail ?? rec.candidate_email ?? rec.email) ??
    null;
  const inviteEmail =
    toStringOrNull(rec.inviteEmail ?? rec.invite_email) ?? candidateEmail;
  const title =
    toStringOrNull(rec.title) ??
    toStringOrNull(rec.trialTitle) ??
    'Trial invite';

  const role =
    toStringOrNull(rec.role) ??
    toStringOrNull(rec.roleName) ??
    toStringOrNull(rec.role_name) ??
    'Role pending';

  const companyValue =
    toStringOrNull(rec.company) ??
    toStringOrNull(rec.companyName) ??
    toStringOrNull(rec.company_name);

  const rawInviteUrl =
    toStringOrNull(rec.inviteUrl) ?? toStringOrNull(rec.invite_url);
  const token =
    toStringOrNull(rec.token) ??
    toStringOrNull(rec.inviteToken) ??
    toStringOrNull(rec.invite_token) ??
    (rawInviteUrl ? extractInviteToken(rawInviteUrl) : null);
  const rawStatus =
    toStringOrNull(rec.status) ??
    toStringOrNull(rec.sessionStatus) ??
    'in_progress';
  const status = CANONICAL_CANDIDATE_SESSION_STATUSES.has(rawStatus)
    ? (rawStatus as CandidateInvite['status'])
    : 'in_progress';

  const progress =
    normalizeProgress(rec.progress) ??
    normalizeProgress(rec.progressSummary) ??
    normalizeProgress(rec.progress_summary) ??
    normalizeProgress(rec.dayProgress) ??
    normalizeProgress(rec.day_progress);

  const scheduledStartAt =
    toDateString(rec.scheduledStartAt) ?? toDateString(rec.scheduled_start_at);
  const candidateTimezone =
    toStringOrNull(rec.candidateTimezone ?? rec.candidate_timezone) ?? null;
  const dayWindows =
    normalizeDayWindows(rec.dayWindows ?? rec.day_windows) ?? null;
  const currentDayWindow =
    normalizeCurrentDayWindow(rec.currentDayWindow ?? rec.current_day_window) ??
    null;
  const scheduleLockedAt =
    toDateString(rec.scheduleLockedAt) ?? toDateString(rec.schedule_locked_at);
  const completedAt =
    toDateString(rec.completedAt) ?? toDateString(rec.completed_at);
  const reportReady =
    rec.reportReady === true ||
    rec.report_ready === true ||
    rec.hasReport === true ||
    rec.has_report === true
      ? true
      : null;
  const hasReport =
    rec.hasReport === true ||
    rec.has_report === true ||
    rec.reportReady === true ||
    rec.report_ready === true
      ? true
      : null;
  const terminatedAt =
    toDateString(rec.terminatedAt) ?? toDateString(rec.terminated_at);
  const isTerminated =
    rec.isTerminated === true ||
    rec.is_terminated === true ||
    terminatedAt !== null;

  const expiresAt =
    toDateString(rec.expiresAt) ??
    toDateString(rec.expires_at) ??
    toDateString(rec.expiryDate) ??
    toDateString(rec.expiry_date) ??
    null;

  const lastActivityAt =
    toDateString(rec.lastActivityAt) ??
    toDateString(rec.last_activity_at) ??
    toDateString(rec.updatedAt) ??
    toDateString(rec.updated_at) ??
    null;

  const isExpired =
    rec.isExpired === true || rec.is_expired === true || status === 'expired';

  return {
    candidateSessionId: Number.isFinite(candidateSessionId)
      ? (candidateSessionId as number)
      : 0,
    token: token ?? null,
    title,
    role,
    company: companyValue && companyValue.trim() ? companyValue : null,
    candidateEmail,
    inviteEmail,
    status,
    talentPartnerName:
      toStringOrNull(rec.talentPartnerName ?? rec.talent_partner_name) ?? null,
    talentPartnerEmail:
      toStringOrNull(rec.talentPartnerEmail ?? rec.talent_partner_email) ??
      null,
    progress,
    scheduledStartAt,
    candidateTimezone,
    dayWindows,
    currentDayWindow,
    scheduleLockedAt,
    completedAt,
    reportReady,
    hasReport,
    terminatedAt,
    isTerminated,
    expiresAt,
    lastActivityAt,
    isExpired,
  };
}
