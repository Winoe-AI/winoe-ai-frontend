import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { DashboardOptions, DashboardPayload } from './useDashboardTypes';
import { fetchDashboard, isAbortError } from './useDashboardApi';

function isCancelledQueryError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'CancelledError' || error.name === 'CanceledError')
  );
}

export function useDashboardQuery(options?: DashboardOptions) {
  const queryClient = useQueryClient();
  const [manualLoading, setManualLoading] = useState(false);
  const dashboardQuery = useQuery({
    queryKey: queryKeys.talentPartner.dashboard(),
    queryFn: ({ signal }) => fetchDashboard(signal),
    enabled: options?.fetchOnMount !== false,
    staleTime: 30_000,
  });

  const refresh = useCallback(
    async (force = true) => {
      const key = queryKeys.talentPartner.dashboard();
      setManualLoading(true);
      if (force) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      try {
        return await queryClient.fetchQuery<DashboardPayload>({
          queryKey: key,
          queryFn: ({ signal }) => fetchDashboard(signal),
          staleTime: 30_000,
        });
      } catch (error) {
        if (isAbortError(error) || isCancelledQueryError(error)) {
          const cached = queryClient.getQueryData<DashboardPayload>(key);
          return (
            cached ?? {
              profile: null,
              trials: [],
              profileError: null,
              trialsError: null,
              requestId: null,
            }
          );
        }
        throw error;
      } finally {
        setManualLoading(false);
      }
    },
    [queryClient],
  );

  const abort = useCallback(() => {
    void queryClient.cancelQueries({
      queryKey: queryKeys.talentPartner.dashboard(),
    });
  }, [queryClient]);

  const fallbackError = useMemo(() => {
    if (!dashboardQuery.error) return null;
    if (isAbortError(dashboardQuery.error)) return null;
    if (dashboardQuery.error instanceof Error) {
      return dashboardQuery.error.message || 'Unable to load your dashboard.';
    }
    return 'Unable to load your dashboard.';
  }, [dashboardQuery.error]);

  const data = dashboardQuery.data;
  const profileError =
    data?.profileError ?? options?.initialProfileError ?? fallbackError;
  const simError = data?.trialsError ?? fallbackError;
  const loading =
    dashboardQuery.isLoading || dashboardQuery.isFetching || manualLoading;

  return {
    profile: data?.profile ?? options?.initialProfile ?? null,
    trials: Array.isArray(data?.trials) ? data.trials : [],
    requestId: data?.requestId ?? null,
    profileError,
    simError,
    loadingProfile: loading,
    loadingTrials: loading,
    refresh,
    abort,
  };
}
