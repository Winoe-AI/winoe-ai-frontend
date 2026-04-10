import { useCallback, type MutableRefObject } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import { reloadCandidateSubmissions } from './useReloadCandidateSubmissions';
import type { LoaderSetters } from './useLoaderTypes';

type Params = {
  trialId: string;
  candidateSessionId: string;
  pageSize: number;
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  showAllRef: MutableRefObject<boolean>;
  pendingOptsRef: MutableRefObject<{ skipCache?: boolean } | null>;
  setters: LoaderSetters;
};

export function useCandidateSubmissionsLoadActions({
  trialId,
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
      if (Object.keys(result.artifacts).length) {
        setters.setArtifacts((prev) => ({ ...prev, ...result.artifacts }));
      }
      setters.setArtifactWarning(result.artifactWarning);
      setters.setError(result.error);
    },
    [setters],
  );

  const runLoad = useCallback(
    (signal?: AbortSignal, skipCache?: boolean) =>
      reloadCandidateSubmissions({
        trialId,
        candidateSessionId,
        pageSize,
        showAll: showAllRef.current,
        preloadArtifacts: showAllRef.current,
        skipCache,
        signal: signal ?? new AbortController().signal,
      }),
    [candidateSessionId, pageSize, showAllRef, trialId],
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
