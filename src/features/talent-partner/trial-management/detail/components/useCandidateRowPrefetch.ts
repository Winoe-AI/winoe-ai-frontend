'use client';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchCandidateWinoeReport } from '@/features/talent-partner/winoe-report/winoeReport.api';
import { reloadCandidateSubmissions } from '@/features/talent-partner/submission-review/hooks/useReloadCandidateSubmissions';
import { queryKeys } from '@/shared/query';

export function useCandidateRowPrefetch(
  trialId: string,
  candidateSessionId: number,
) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const sessionId = String(candidateSessionId);
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.talentPartner.candidateSubmissions(
          trialId,
          sessionId,
        ),
        queryFn: ({ signal }) =>
          reloadCandidateSubmissions({
            trialId,
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
        queryKey: queryKeys.talentPartner.winoeReportStatus(sessionId),
        queryFn: ({ signal }) => fetchCandidateWinoeReport(sessionId, signal),
        staleTime: 10_000,
      }),
    ]);
  }, [candidateSessionId, queryClient, trialId]);
}
