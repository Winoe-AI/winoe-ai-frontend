import type {
  CandidateSession,
  SimulationListItem,
} from '@/features/recruiter/api/typesApi';

export type RecruiterProfile = {
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
  simulationId: string;
  simulationTitle: string;
};

export type InviteSuccess = {
  inviteUrl: string;
  outcome: 'created' | 'resent';
  candidateName: string;
  candidateEmail: string;
  simulationId: string;
};

export type { CandidateSession, SimulationListItem };
