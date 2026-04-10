import type {
  TalentPartnerProfile,
  TrialListItem,
} from '@/features/talent-partner/types';

export type DashboardOptions = {
  initialProfile?: TalentPartnerProfile | null;
  initialProfileError?: string | null;
  fetchOnMount?: boolean;
};

export type DashboardPayload = {
  profile: TalentPartnerProfile | null;
  trials: TrialListItem[];
  profileError: string | null;
  trialsError: string | null;
  requestId?: string | null;
};
