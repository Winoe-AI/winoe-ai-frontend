import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type CandidateCompareRow } from '@/features/recruiter/api';
import { queryKeys } from '@/shared/query';
import {
  fetchSimulationCompareQuery,
  SIMULATION_COMPARE_STALE_TIME_MS,
} from '../queries';
import { deriveSimulationCandidatesCompareError } from './useSimulationCandidatesCompare.error';
import { useSimulationCandidatesCompareGenerateAction } from './useSimulationCandidatesCompare.generate';
import { useSimulationCandidatesCompareReady } from './useSimulationCandidatesCompare.ready';

const COMPARE_POLL_INTERVAL_MS = 10_000;

type Params = {
  simulationId: string;
  enabled: boolean;
};

export function useSimulationCandidatesCompare({
  simulationId,
  enabled,
}: Params) {
  const queryClient = useQueryClient();
  const compareReady = useSimulationCandidatesCompareReady({
    enabled,
    simulationId,
  });
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>(
    {},
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setGeneratingIds({});
    setLocalError(null);
  }, [simulationId]);

  const compareQuery = useQuery({
    queryKey: queryKeys.recruiter.simulationCompare(simulationId),
    queryFn: ({ signal }) => fetchSimulationCompareQuery(simulationId, signal),
    enabled: enabled && compareReady && Boolean(simulationId),
    staleTime: SIMULATION_COMPARE_STALE_TIME_MS,
    refetchInterval: (query) => {
      const rows =
        (query.state.data as CandidateCompareRow[] | undefined) ?? [];
      const hasGeneratingRows =
        rows.some((row) => row.fitProfileStatus === 'generating') ||
        Object.keys(generatingIds).length > 0;
      return enabled && hasGeneratingRows ? COMPARE_POLL_INTERVAL_MS : false;
    },
  });

  const error = useMemo(() => {
    return deriveSimulationCandidatesCompareError(compareQuery.error, localError);
  }, [compareQuery.error, localError]);

  const reload = useCallback(async () => {
    setLocalError(null);
    await queryClient.fetchQuery({
      queryKey: queryKeys.recruiter.simulationCompare(simulationId),
      queryFn: ({ signal }) =>
        fetchSimulationCompareQuery(simulationId, signal, true),
      staleTime: SIMULATION_COMPARE_STALE_TIME_MS,
    });
  }, [queryClient, simulationId]);

  const generateFitProfile = useSimulationCandidatesCompareGenerateAction({
    simulationId,
    generatingIds,
    setGeneratingIds,
    setLocalError,
    queryClient,
    refetchCompare: compareQuery.refetch,
  });

  return {
    rows: compareQuery.data ?? [],
    loading:
      enabled &&
      compareReady &&
      (compareQuery.isLoading || compareQuery.isFetching),
    error,
    generatingIds,
    reload,
    generateFitProfile,
  };
}
