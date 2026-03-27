import { resendCandidateInvite } from '@/features/recruiter/api/resendCandidateInviteApi';
import type { CandidateSession } from '@/features/recruiter/types';
import { toResendOutcome } from './useResendInviteOutcome';
import type { ResendOutcome } from './useResendInviteOutcome';

export async function fetchResendOutcome(
  simulationId: string,
  candidate: CandidateSession,
): Promise<ResendOutcome> {
  const res = await resendCandidateInvite(
    simulationId,
    candidate.candidateSessionId,
  );
  const normalized = res.body as CandidateSession | null;
  return toResendOutcome(res, normalized);
}
