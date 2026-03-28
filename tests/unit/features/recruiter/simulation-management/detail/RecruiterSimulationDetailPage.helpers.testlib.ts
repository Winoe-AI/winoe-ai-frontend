import { __testables } from '@/features/recruiter/simulation-management/detail/RecruiterSimulationDetailPage';
import type { CandidateSession } from '@/features/recruiter/types';

export const baseCandidate: CandidateSession = {
  candidateSessionId: 1,
  inviteEmail: null,
  candidateName: null,
  status: 'not_started',
  startedAt: null,
  completedAt: null,
  hasReport: false,
  verified: null,
  verificationStatus: null,
  verifiedAt: null,
  dayProgress: null,
};

export { __testables };
