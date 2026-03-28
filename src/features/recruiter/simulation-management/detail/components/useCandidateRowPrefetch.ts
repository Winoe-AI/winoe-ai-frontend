'use client';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchCandidateFitProfile } from '@/features/recruiter/fit-profile/fitProfile.api';
import { reloadCandidateSubmissions } from '@/features/recruiter/submission-review/hooks/useReloadCandidateSubmissions';
import { queryKeys } from '@/shared/query';

export function useCandidateRowPrefetch(
  simulationId: string,
  candidateSessionId: number,
) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const sessionId = String(candidateSessionId);
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.candidateSubmissions(
          simulationId,
          sessionId,
        ),
        queryFn: ({ signal }) =>
          reloadCandidateSubmissions({
            simulationId,
            candidateSessionId: sessionId,
            pageSize: 8,
            showAll: false,
            preloadArtifacts: false,
            skipCache: false,
            signal,
          }),
        staleTime: 10_000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.fitProfileStatus(sessionId),
        queryFn: ({ signal }) => fetchCandidateFitProfile(sessionId, signal),
        staleTime: 10_000,
      }),
    ]);
  }, [candidateSessionId, queryClient, simulationId]);
}
