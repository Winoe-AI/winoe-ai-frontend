import { resendCandidateInvite } from '@/features/talent-partner/api/resendCandidateInviteApi';
import type { CandidateSession } from '@/features/talent-partner/types';
import { toResendOutcome } from './useResendInviteOutcome';
import type { ResendOutcome } from './useResendInviteOutcome';

export async function fetchResendOutcome(
  trialId: string,
  candidate: CandidateSession,
): Promise<ResendOutcome> {
  const res = await resendCandidateInvite(
    trialId,
    candidate.candidateSessionId,
  );
  const normalized = res.body as CandidateSession | null;
  return toResendOutcome(res, normalized);
}
