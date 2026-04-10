import type {
  CandidateSession,
  TrialListItem,
} from '@/features/talent-partner/api/typesApi';

export type TalentPartnerProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId?: number | null;
  companyName?: string | null;
  onboardingComplete?: boolean;
};

export type InviteModalState = {
  open: boolean;
  trialId: string;
  trialTitle: string;
};

export type InviteSuccess = {
  inviteUrl: string;
  outcome: 'created' | 'resent';
  candidateName: string;
  candidateEmail: string;
  trialId: string;
};

export type { CandidateSession, TrialListItem };
