'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { TrialListItem } from '@/features/talent-partner/api';
import {
  fetchTrialCandidatesQuery,
  fetchTrialCompareQuery,
  fetchTrialDetailQuery,
  TRIAL_CANDIDATES_STALE_TIME_MS,
  TRIAL_COMPARE_STALE_TIME_MS,
  TRIAL_DETAIL_STALE_TIME_MS,
} from '@/features/talent-partner/trial-management/detail/queries';

export const LINK_PREFETCH =
  process.env.NODE_ENV === 'test' ? undefined : false;
export const LINK_PREFETCH_RETURNING =
  process.env.NODE_ENV === 'test' ? undefined : true;

const ENABLE_INTENT_PREFETCH = process.env.NODE_ENV !== 'test';
const DASHBOARD_VISITED_KEY = 'winoe:dashboard:visited';

export function useTrialListPrefetch(trials: TrialListItem[]) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const prefetchTrial = useCallback(
    (trialId: string) => {
      if (!ENABLE_INTENT_PREFETCH) return;
      void router.prefetch(`/dashboard/trials/${trialId}`);
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.talentPartner.trialDetail(trialId),
          queryFn: ({ signal }) => fetchTrialDetailQuery(trialId, signal),
          staleTime: TRIAL_DETAIL_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.talentPartner.trialCandidates(trialId),
          queryFn: ({ signal }) => fetchTrialCandidatesQuery(trialId, signal),
          staleTime: TRIAL_CANDIDATES_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.talentPartner.trialCompare(trialId),
          queryFn: ({ signal }) => fetchTrialCompareQuery(trialId, signal),
          staleTime: TRIAL_COMPARE_STALE_TIME_MS,
        }),
      ]);
    },
    [queryClient, router],
  );

  useEffect(() => {
    if (!ENABLE_INTENT_PREFETCH || trials.length === 0) return;
    const firstTrialId = trials[0]?.id;
    if (!firstTrialId) return;
    const hasVisited =
      window.sessionStorage.getItem(DASHBOARD_VISITED_KEY) === '1';
    window.sessionStorage.setItem(DASHBOARD_VISITED_KEY, '1');
    if (!hasVisited) return;
    prefetchTrial(firstTrialId);
  }, [prefetchTrial, trials]);

  return prefetchTrial;
}
