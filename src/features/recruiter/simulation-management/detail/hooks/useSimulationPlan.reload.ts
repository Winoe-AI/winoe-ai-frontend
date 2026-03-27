import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchSimulationDetailQuery } from '../queries';

export function useSimulationPlanReload(simulationId: string) {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const queryKey = queryKeys.recruiter.simulationDetail(simulationId);
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchSimulationDetailQuery(simulationId, signal, true),
      staleTime: 0,
    });
  }, [queryClient, simulationId]);
}
