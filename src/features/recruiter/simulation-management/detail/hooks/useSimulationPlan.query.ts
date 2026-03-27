import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import {
  fetchSimulationDetailQuery,
  SIMULATION_DETAIL_STALE_TIME_MS,
} from '../queries';

export function useSimulationPlanQuery(simulationId: string) {
  return useQuery({
    queryKey: queryKeys.recruiter.simulationDetail(simulationId),
    queryFn: ({ signal }) =>
      fetchSimulationDetailQuery(simulationId, signal, false),
    enabled: Boolean(simulationId),
    staleTime: SIMULATION_DETAIL_STALE_TIME_MS,
  });
}
