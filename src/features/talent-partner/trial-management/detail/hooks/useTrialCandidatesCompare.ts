import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type CandidateCompareRow } from '@/features/talent-partner/api';
import {
  filterCandidateCompareRowsForTrial,
  isCandidateCompareRowEligibleForBenchmarks,
} from '@/features/talent-partner/api/candidatesCompareNormalizeApi';
import { queryKeys } from '@/shared/query';
import {
  fetchTrialCompareQuery,
  TRIAL_COMPARE_STALE_TIME_MS,
} from '../queries';
import { deriveTrialCandidatesCompareError } from './useTrialCandidatesCompare.error';
import { useTrialCandidatesCompareGenerateAction } from './useTrialCandidatesCompare.generate';
import { useTrialCandidatesCompareReady } from './useTrialCandidatesCompare.ready';

const COMPARE_POLL_INTERVAL_MS = 10_000;

type Params = {
  trialId: string;
  enabled: boolean;
};

export function useTrialCandidatesCompare({ trialId, enabled }: Params) {
  const queryClient = useQueryClient();
  const compareReady = useTrialCandidatesCompareReady({
    enabled,
    trialId,
  });
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>(
    {},
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setGeneratingIds({});
      setLocalError(null);
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [enabled, trialId]);

  const compareQuery = useQuery({
    queryKey: queryKeys.talentPartner.trialCompare(trialId),
    queryFn: ({ signal }) => fetchTrialCompareQuery(trialId, signal),
    enabled: enabled && compareReady && Boolean(trialId),
    staleTime: TRIAL_COMPARE_STALE_TIME_MS,
    refetchInterval: (query) => {
      const rows =
        (query.state.data as CandidateCompareRow[] | undefined) ?? [];
      const hasGeneratingRows =
        rows.some((row) => row.winoeReportStatus === 'generating') ||
        Object.keys(generatingIds).length > 0;
      return enabled && hasGeneratingRows ? COMPARE_POLL_INTERVAL_MS : false;
    },
  });

  const visibleRows = useMemo(
    () =>
      filterCandidateCompareRowsForTrial(
        compareQuery.data ?? [],
        trialId,
      ).filter(isCandidateCompareRowEligibleForBenchmarks),
    [compareQuery.data, trialId],
  );

  const error = useMemo(() => {
    return deriveTrialCandidatesCompareError(compareQuery.error, localError);
  }, [compareQuery.error, localError]);

  const reload = useCallback(async () => {
    setLocalError(null);
    await queryClient.fetchQuery({
      queryKey: queryKeys.talentPartner.trialCompare(trialId),
      queryFn: ({ signal }) => fetchTrialCompareQuery(trialId, signal, true),
      staleTime: TRIAL_COMPARE_STALE_TIME_MS,
    });
  }, [queryClient, trialId]);

  const generateWinoeReport = useTrialCandidatesCompareGenerateAction({
    trialId,
    generatingIds,
    setGeneratingIds,
    setLocalError,
    queryClient,
    refetchCompare: compareQuery.refetch,
  });

  return {
    rows: visibleRows,
    loading:
      enabled &&
      compareReady &&
      (compareQuery.isLoading || compareQuery.isFetching),
    error,
    generatingIds,
    reload,
    generateWinoeReport,
  };
}
