'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { SimulationListItem } from '@/features/recruiter/api';
import {
  fetchSimulationCandidatesQuery,
  fetchSimulationCompareQuery,
  fetchSimulationDetailQuery,
  SIMULATION_CANDIDATES_STALE_TIME_MS,
  SIMULATION_COMPARE_STALE_TIME_MS,
  SIMULATION_DETAIL_STALE_TIME_MS,
} from '@/features/recruiter/simulations/detail/queries';

export const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;
export const LINK_PREFETCH_RETURNING =
  process.env.NODE_ENV === 'test' ? undefined : true;

const ENABLE_INTENT_PREFETCH = process.env.NODE_ENV !== 'test';
const DASHBOARD_VISITED_KEY = 'tenon:dashboard:visited';

export function useSimulationListPrefetch(simulations: SimulationListItem[]) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const prefetchSimulation = useCallback(
    (simulationId: string) => {
      if (!ENABLE_INTENT_PREFETCH) return;
      void router.prefetch(`/dashboard/simulations/${simulationId}`);
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationDetail(simulationId),
          queryFn: ({ signal }) => fetchSimulationDetailQuery(simulationId, signal),
          staleTime: SIMULATION_DETAIL_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationCandidates(simulationId),
          queryFn: ({ signal }) =>
            fetchSimulationCandidatesQuery(simulationId, signal),
          staleTime: SIMULATION_CANDIDATES_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationCompare(simulationId),
          queryFn: ({ signal }) => fetchSimulationCompareQuery(simulationId, signal),
          staleTime: SIMULATION_COMPARE_STALE_TIME_MS,
        }),
      ]);
    },
    [queryClient, router],
  );

  useEffect(() => {
    if (!ENABLE_INTENT_PREFETCH || simulations.length === 0) return;
    const firstSimulationId = simulations[0]?.id;
    if (!firstSimulationId) return;
    const hasVisited =
      window.sessionStorage.getItem(DASHBOARD_VISITED_KEY) === '1';
    window.sessionStorage.setItem(DASHBOARD_VISITED_KEY, '1');
    if (!hasVisited) return;
    prefetchSimulation(firstSimulationId);
  }, [prefetchSimulation, simulations]);

  return prefetchSimulation;
}
