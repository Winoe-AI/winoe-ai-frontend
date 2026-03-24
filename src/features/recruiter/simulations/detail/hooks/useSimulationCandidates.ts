import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { queryKeys } from '@/shared/query';
import type { CandidateSession } from '@/features/recruiter/types';
import {
  fetchSimulationCandidatesQuery,
  SIMULATION_CANDIDATES_STALE_TIME_MS,
} from '../queries';

type Params = { simulationId: string };

export function useSimulationCandidates({
  simulationId,
  enabled = true,
}: Params & { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.recruiter.simulationCandidates(simulationId);

  const candidatesQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      fetchSimulationCandidatesQuery(simulationId, signal),
    enabled: enabled && Boolean(simulationId),
    staleTime: SIMULATION_CANDIDATES_STALE_TIME_MS,
  });

  const error = useMemo(() => {
    if (!candidatesQuery.error) return null;
    const status = toStatus(candidatesQuery.error);
    if (status === 401) return 'Session expired. Please sign in again.';
    if (status === 403) return 'You are not authorized to view candidates.';
    let message = toUserMessage(candidatesQuery.error, 'Request failed', {
      includeDetail: false,
    });
    if (
      status &&
      status >= 500 &&
      /request failed with status/i.test(message)
    ) {
      message = 'Request failed';
    }
    return message || 'Request failed';
  }, [candidatesQuery.error]);

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchSimulationCandidatesQuery(simulationId, signal, true),
      staleTime: 0,
    });
  }, [queryClient, queryKey, simulationId]);

  const setCandidates = useCallback<
    Dispatch<SetStateAction<CandidateSession[]>>
  >(
    (value) => {
      queryClient.setQueryData<CandidateSession[]>(queryKey, (prev) => {
        const current = Array.isArray(prev) ? prev : [];
        if (typeof value === 'function') {
          return value(current);
        }
        return value;
      });
    },
    [queryClient, queryKey],
  );

  return {
    candidates: Array.isArray(candidatesQuery.data) ? candidatesQuery.data : [],
    loading:
      enabled && (candidatesQuery.isLoading || candidatesQuery.isFetching),
    error,
    reload,
    setCandidates,
  };
}
