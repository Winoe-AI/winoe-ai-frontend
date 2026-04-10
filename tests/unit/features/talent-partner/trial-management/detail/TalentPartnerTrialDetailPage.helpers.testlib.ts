import { __testables } from '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage';
import type { CandidateSession } from '@/features/talent-partner/types';

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
