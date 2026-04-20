import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toStatus, toUserMessage } from '@/platform/errors/errors';
import { queryKeys } from '@/shared/query';
import type { CandidateSession } from '@/features/talent-partner/types';
import {
  fetchTrialCandidatesQuery,
  TRIAL_CANDIDATES_STALE_TIME_MS,
} from '../queries';

type Params = { trialId: string };

export function useTrialCandidates({
  trialId,
  enabled = true,
}: Params & { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.talentPartner.trialCandidates(trialId);

  const candidatesQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchTrialCandidatesQuery(trialId, signal),
    enabled: enabled && Boolean(trialId),
    staleTime: TRIAL_CANDIDATES_STALE_TIME_MS,
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
    const data = await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => fetchTrialCandidatesQuery(trialId, signal, true),
      staleTime: 0,
    });
    return Array.isArray(data) ? data : [];
  }, [queryClient, queryKey, trialId]);

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
