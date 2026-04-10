import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchCandidateWinoeReport } from './winoeReport.api';

export function useWinoeReportRefresh(candidateSessionId: string) {
  const queryClient = useQueryClient();
  const queryKey =
    queryKeys.talentPartner.winoeReportStatus(candidateSessionId);

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchCandidateWinoeReport(candidateSessionId, signal, {
          skipCache: true,
        }),
      staleTime: 0,
    });
  }, [candidateSessionId, queryClient, queryKey]);
}
