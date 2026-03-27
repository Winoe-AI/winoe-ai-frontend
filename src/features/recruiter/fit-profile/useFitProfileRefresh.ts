import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchCandidateFitProfile } from './fitProfile.api';

export function useFitProfileRefresh(candidateSessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.recruiter.fitProfileStatus(candidateSessionId);

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchCandidateFitProfile(candidateSessionId, signal, {
          skipCache: true,
        }),
      staleTime: 0,
    });
  }, [candidateSessionId, queryClient, queryKey]);
}
