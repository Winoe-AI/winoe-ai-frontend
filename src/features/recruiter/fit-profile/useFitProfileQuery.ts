import { useQuery } from '@tanstack/react-query';
import { toStatus } from '@/platform/errors/errors';
import { queryKeys } from '@/shared/query';
import { fetchCandidateFitProfile } from './fitProfile.api';
import {
  FIT_PROFILE_POLL_INTERVAL_MS,
  type FitProfileFetchOutcome,
} from './fitProfile.types';

const FIT_PROFILE_LOADING_STALE_MS = 10_000;

export function useFitProfileQuery(candidateSessionId: string) {
  return useQuery({
    queryKey: queryKeys.recruiter.fitProfileStatus(candidateSessionId),
    queryFn: async ({ signal }) => {
      try {
        return await fetchCandidateFitProfile(candidateSessionId, signal, {
          skipCache: true,
        });
      } catch (error) {
        if (toStatus(error) === 409) {
          return {
            kind: 'running',
            warnings: [],
          } satisfies FitProfileFetchOutcome;
        }
        throw error;
      }
    },
    enabled: Boolean(candidateSessionId),
    staleTime: (query) => {
      const data = query.state.data as FitProfileFetchOutcome | undefined;
      return data?.kind === 'ready'
        ? Number.POSITIVE_INFINITY
        : FIT_PROFILE_LOADING_STALE_MS;
    },
    refetchInterval: (query) => {
      const data = query.state.data as FitProfileFetchOutcome | undefined;
      return data?.kind === 'running' ? FIT_PROFILE_POLL_INTERVAL_MS : false;
    },
  });
}
