import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type CandidateCompareRow } from '@/features/recruiter/api';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { queryKeys } from '@/shared/query';
import { generateCandidateFitProfile } from '@/features/recruiter/simulations/candidates/fitProfile/fitProfile.api';
import {
  fetchSimulationCompareQuery,
  SIMULATION_COMPARE_STALE_TIME_MS,
} from '../queries';

const COMPARE_POLL_INTERVAL_MS = 10_000;
const INITIAL_COMPARE_FETCH_DELAY_MS = 1200;

type Params = {
  simulationId: string;
  enabled: boolean;
};

export function useSimulationCandidatesCompare({
  simulationId,
  enabled,
}: Params) {
  const queryClient = useQueryClient();
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>(
    {},
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [compareReady, setCompareReady] = useState(
    process.env.NODE_ENV === 'test',
  );

  useEffect(() => {
    if (!enabled) {
      setCompareReady(false);
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      setCompareReady(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setCompareReady(true);
    }, INITIAL_COMPARE_FETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, simulationId]);

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
    if (localError) return localError;
    if (!compareQuery.error) return null;
    const status = toStatus(compareQuery.error);
    if (status === 403) {
      return 'You are not authorized to compare candidates for this simulation.';
    }
    if (status === 404) {
      return 'Compare candidates unavailable for this simulation right now.';
    }
    return toUserMessage(
      compareQuery.error,
      'Unable to load candidate comparison right now.',
      { includeDetail: false },
    );
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

  const generateFitProfile = useCallback(
    async (candidateSessionId: string) => {
      if (!candidateSessionId || generatingIds[candidateSessionId]) return;

      setLocalError(null);
      setGeneratingIds((prev) => ({ ...prev, [candidateSessionId]: true }));
      queryClient.setQueryData<CandidateCompareRow[]>(
        queryKeys.recruiter.simulationCompare(simulationId),
        (prev) =>
          Array.isArray(prev)
            ? prev.map((row) =>
                row.candidateSessionId === candidateSessionId
                  ? { ...row, fitProfileStatus: 'generating' }
                  : row,
              )
            : prev,
      );

      try {
        await generateCandidateFitProfile(candidateSessionId);
      } catch (caught: unknown) {
        const status = toStatus(caught);
        if (status === 403) {
          setLocalError(
            'You are not authorized to generate Fit Profiles for this candidate.',
          );
        } else if (status !== 409) {
          setLocalError(
            toUserMessage(caught, 'Unable to generate Fit Profile right now.', {
              includeDetail: false,
            }),
          );
        }
      } finally {
        setGeneratingIds((prev) => {
          const next = { ...prev };
          delete next[candidateSessionId];
          return next;
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.recruiter.simulationCompare(simulationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.recruiter.fitProfileStatus(candidateSessionId),
        }),
      ]);
      await compareQuery.refetch();
    },
    [compareQuery, generatingIds, queryClient, simulationId],
  );

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
