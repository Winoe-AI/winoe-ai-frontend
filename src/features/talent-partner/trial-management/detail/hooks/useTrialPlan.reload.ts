import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchTrialDetailQuery } from '../queries';

export function useTrialPlanReload(trialId: string) {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const queryKey = queryKeys.talentPartner.trialDetail(trialId);
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => fetchTrialDetailQuery(trialId, signal, true),
      staleTime: 0,
    });
  }, [queryClient, trialId]);
}
