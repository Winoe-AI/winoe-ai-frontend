import type {
  TalentPartnerProfile,
  TrialListItem,
} from '@/features/talent-partner/types';

export const fallbackProfile = {
  profile: null,
  error: 'Unable to load your profile right now.',
  status: 502,
  meta: undefined,
};

export const fallbackTrials = {
  trials: [],
  error: 'Failed to load trials.',
  status: 502,
  meta: undefined,
};

export const settled = <T>(outcome: PromiseSettledResult<T>, fallback: T) =>
  outcome.status === 'fulfilled' ? outcome.value : fallback;

export const toWorstStatus = (values: Array<number | null | undefined>) =>
  values.reduce<number>((max, v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.max(max, v);
    return max;
  }, 0);

export const totalRetries = (...attempts: Array<number | undefined>) =>
  attempts.reduce<number>(
    (sum, attempt) => sum + Math.max(0, (attempt ?? 1) - 1),
    0,
  );

export type DashboardPayload = {
  profile: TalentPartnerProfile | null;
  trials: TrialListItem[];
  profileError: string | null;
  trialsError: string | null;
};
