import { useCallback } from 'react';
import { useAsyncLoader } from '@/shared/hooks';
import { dashboardPerfDebugEnabled, logPerf, nowMs } from '../utils/perfUtils';
import type { DashboardPayload } from './useDashboardTypes';
import { fetchDashboard, isAbortError } from './useDashboardApi';
import type { DashboardState } from './useDashboardState';

type Refs = {
  inflightRef: React.MutableRefObject<Promise<DashboardPayload> | null>;
  controllerRef: React.MutableRefObject<AbortController | null>;
  requestSeqRef: React.MutableRefObject<number>;
};

export function useDashboardRefresh(
  setState: React.Dispatch<React.SetStateAction<DashboardState>>,
  refs: Refs,
) {
  const { inflightRef, controllerRef, requestSeqRef } = refs;

  const loader = useCallback(
    (signal?: AbortSignal) => fetchDashboard(signal),
    [],
  );

  const { load, abort } = useAsyncLoader(loader, {
    immediate: false,
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        profile: data?.profile ?? null,
        trials: Array.isArray(data?.trials) ? data.trials : [],
        requestId: data?.requestId ?? null,
        profileError: data?.profileError ?? null,
        trialsError: data?.trialsError ?? null,
        loadingProfile: false,
        loadingTrials: false,
      }));
      if (dashboardPerfDebugEnabled)
        logPerf('/api/dashboard response', nowMs(), { status: 200 });
    },
    onError: (err) => {
      if (isAbortError(err)) {
        setState((prev) => ({
          ...prev,
          loadingProfile: false,
          loadingTrials: false,
        }));
        return null;
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load your dashboard.';
      setState((prev) => ({
        ...prev,
        profileError: message,
        trialsError: message,
        loadingProfile: false,
        loadingTrials: false,
      }));
      if (dashboardPerfDebugEnabled)
        logPerf('/api/dashboard response', nowMs(), { status: 'error' });
      return message;
    },
  });

  const refresh = useCallback(
    (force = true) => {
      if (!force && inflightRef.current) return inflightRef.current;
      controllerRef.current?.abort();
      controllerRef.current = null;
      requestSeqRef.current += 1;
      setState((prev) => ({
        ...prev,
        profileError: null,
        trialsError: null,
        loadingProfile: true,
        loadingTrials: true,
      }));
      const run = load(true) as Promise<DashboardPayload>;
      inflightRef.current = run;
      return run;
    },
    [controllerRef, inflightRef, load, requestSeqRef, setState],
  );

  return { refresh, abort };
}
