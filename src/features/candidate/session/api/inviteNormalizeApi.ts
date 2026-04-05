import {
  toCandidateSessionId,
  toDateString,
  toNumberOrNull,
  toStringOrNull,
} from './baseApi';
import type { CandidateInvite } from './typesApi';
import { extractInviteToken } from '@/features/candidate/portal/utils/inviteTokensUtils';
const normalizeProgress = (
  raw: unknown,
): { completed: number; total: number } | null => {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const completed =
    toNumberOrNull(rec.completed) ??
    toNumberOrNull(rec.completedTasks) ??
    toNumberOrNull(rec.completed_tasks);
  const total =
    toNumberOrNull(rec.total) ??
    toNumberOrNull(rec.totalTasks) ??
    toNumberOrNull(rec.total_tasks);
  if (completed === null || total === null) return null;
  return { completed, total };
};

export function normalizeCandidateInvite(raw: unknown): CandidateInvite {
  const rec = (raw ?? {}) as Record<string, unknown>;
  const candidateSessionId = toCandidateSessionId(
    rec.candidateSessionId ?? rec.candidate_session_id ?? rec.id,
  );
  const title =
    toStringOrNull(rec.title) ??
    toStringOrNull(rec.simulationTitle) ??
    'Simulation invite';

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
  const status =
    toStringOrNull(rec.status) ??
    toStringOrNull(rec.sessionStatus) ??
    'in_progress';

  const progress =
    normalizeProgress(rec.progress) ??
    normalizeProgress(rec.progressSummary) ??
    normalizeProgress(rec.progress_summary);

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
    recruiterName:
      toStringOrNull(rec.recruiterName ?? rec.recruiter_name) ?? null,
    recruiterEmail:
      toStringOrNull(rec.recruiterEmail ?? rec.recruiter_email) ?? null,
    status,
    progress,
    expiresAt,
    lastActivityAt,
    isExpired,
  };
}
