import type { CandidateSession } from '@/features/talent-partner/types';
import type { InviteSuccess } from '@/features/talent-partner/types';
import type { InviteUiState } from '@/features/talent-partner/trial-management/invitations/InviteCandidateTypes';

const SUCCESS_EMAIL_STATUSES = new Set(['sent', 'delivered', 'opened']);

const normalizeEmail = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? '';

const normalizeStatus = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? '';

export function findInvitedCandidate(
  candidates: CandidateSession[],
  invite: Pick<InviteSuccess, 'candidateSessionId' | 'candidateEmail'>,
) {
  const sessionId = invite.candidateSessionId.trim();
  if (sessionId) {
    const bySessionId = candidates.find(
      (candidate) => String(candidate.candidateSessionId) === sessionId,
    );
    if (bySessionId) return bySessionId;
  }

  const inviteEmail = normalizeEmail(invite.candidateEmail);
  if (!inviteEmail) return null;

  return (
    candidates.find(
      (candidate) => normalizeEmail(candidate.inviteEmail) === inviteEmail,
    ) ?? null
  );
}

function buildWarningMessage(status: string) {
  if (status === 'rate_limited')
    return 'Invite link created, but email delivery was rate limited. Copy the invite URL and retry later.';
  if (status === 'failed' || status === 'bounced')
    return 'Invite link created, but email delivery failed. Copy the invite URL and retry later.';
  return 'Invite link created, but email delivery was not confirmed. Copy the invite URL and retry later.';
}

export function buildInviteModalState(params: {
  invite: InviteSuccess;
  candidate: CandidateSession | null;
}): InviteUiState {
  const { invite, candidate } = params;
  const inviteEmailStatus = candidate?.inviteEmailStatus ?? null;
  const normalizedStatus = normalizeStatus(inviteEmailStatus);
  const inviteUrl =
    invite.inviteUrl?.trim() || candidate?.inviteUrl?.trim() || '';
  const baseState = {
    inviteUrl: inviteUrl || undefined,
    candidateName: candidate?.candidateName ?? invite.candidateName,
    candidateEmail: candidate?.inviteEmail ?? invite.candidateEmail,
    candidateSessionId: invite.candidateSessionId,
    outcome: invite.outcome,
    inviteEmailStatus,
  };

  if (normalizedStatus && SUCCESS_EMAIL_STATUSES.has(normalizedStatus)) {
    return {
      status: 'success',
      message: invite.outcome === 'resent' ? 'Invite resent.' : 'Invite sent.',
      ...baseState,
    };
  }

  return {
    status: 'warning',
    message: buildWarningMessage(normalizedStatus),
    ...baseState,
  };
}
