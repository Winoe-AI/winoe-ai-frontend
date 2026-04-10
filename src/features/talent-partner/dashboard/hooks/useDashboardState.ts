import type { DashboardOptions, DashboardPayload } from './useDashboardTypes';

export type DashboardState = {
  profile: DashboardPayload['profile'];
  trials: DashboardPayload['trials'];
  requestId: string | null;
  profileError: string | null;
  simError: string | null;
  loadingProfile: boolean;
  loadingTrials: boolean;
};

export const makeInitialDashboardState = (
  options?: DashboardOptions,
): DashboardState => ({
  profile: options?.initialProfile ?? null,
  trials: [],
  requestId: null,
  profileError: options?.initialProfileError ?? null,
  simError: null,
  loadingProfile: options?.fetchOnMount !== false,
  loadingTrials: options?.fetchOnMount !== false,
});
