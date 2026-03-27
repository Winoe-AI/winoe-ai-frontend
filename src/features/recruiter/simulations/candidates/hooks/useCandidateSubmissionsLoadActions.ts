import { useCallback, type MutableRefObject } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import { reloadCandidateSubmissions } from './reloadCandidateSubmissions';
import type { LoaderSetters } from './loaderTypes';

type Params = {
  simulationId: string;
  candidateSessionId: string;
  pageSize: number;
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  showAllRef: MutableRefObject<boolean>;
  pendingOptsRef: MutableRefObject<{ skipCache?: boolean } | null>;
  setters: LoaderSetters;
};

export function useCandidateSubmissionsLoadActions({
  simulationId,
  candidateSessionId,
  pageSize,
  queryClient,
  queryKey,
  showAllRef,
  pendingOptsRef,
  setters,
}: Params) {
  const applyResult = useCallback(
    (result: Awaited<ReturnType<typeof reloadCandidateSubmissions>>) => {
      setters.setCandidate(result.candidate);
      setters.setItems(result.items);
      setters.setArtifacts((prev) => ({ ...prev, ...result.artifacts }));
      setters.setArtifactWarning(result.artifactWarning);
      setters.setError(result.error);
    },
    [setters],
  );

  const runLoad = useCallback(
    (signal?: AbortSignal, skipCache?: boolean) =>
      reloadCandidateSubmissions({
        simulationId,
        candidateSessionId,
        pageSize,
        showAll: showAllRef.current,
        preloadArtifacts: showAllRef.current,
        skipCache,
        signal: signal ?? new AbortController().signal,
      }),
    [candidateSessionId, pageSize, showAllRef, simulationId],
  );

  const reload = useCallback(
    async (opts?: { skipCache?: boolean }) => {
      pendingOptsRef.current = opts ?? null;
      setters.setArtifactWarning(null);
      setters.setError(null);
      setters.setLoading(true);

      try {
        await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
        await queryClient.fetchQuery({
          queryKey,
          queryFn: ({ signal }) => runLoad(signal, Boolean(opts?.skipCache)),
          staleTime: 0,
        });
      } catch {}
    },
    [pendingOptsRef, queryClient, queryKey, runLoad, setters],
  );

  return { applyResult, runLoad, reload };
}
