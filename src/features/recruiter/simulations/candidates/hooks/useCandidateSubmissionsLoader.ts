import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { reloadCandidateSubmissions } from './reloadCandidateSubmissions';
import type { LoaderSetters } from './loaderTypes';

type LoaderParams = {
  simulationId: string;
  candidateSessionId: string;
  pageSize: number;
  showAll: boolean;
  setters: LoaderSetters;
};

const SUBMISSIONS_STALE_TIME_MS = 10_000;

export function useCandidateSubmissionsLoader({
  simulationId,
  candidateSessionId,
  pageSize,
  showAll,
  setters,
}: LoaderParams) {
  const queryClient = useQueryClient();
  const showAllRef = useRef(showAll);
  const pendingOptsRef = useRef<{ skipCache?: boolean } | null>(null);
  const queryKey = queryKeys.recruiter.candidateSubmissions(
    simulationId,
    candidateSessionId,
  );

  const applyResult = useCallback(
    (result: Awaited<ReturnType<typeof reloadCandidateSubmissions>>) => {
      setters.setCandidate(result.candidate);
      setters.setItems(result.items);
      setters.setArtifacts((prev) => ({
        ...prev,
        ...result.artifacts,
      }));
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
    [candidateSessionId, pageSize, simulationId],
  );

  const submissionsQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => runLoad(signal, pendingOptsRef.current?.skipCache),
    enabled: Boolean(simulationId) && Boolean(candidateSessionId),
    staleTime: SUBMISSIONS_STALE_TIME_MS,
  });

  useEffect(() => {
    if (!submissionsQuery.data) return;
    applyResult(submissionsQuery.data);
  }, [applyResult, submissionsQuery.data]);

  useEffect(() => {
    if (!submissionsQuery.error) return;
    const message =
      submissionsQuery.error instanceof Error && submissionsQuery.error.message
        ? submissionsQuery.error.message
        : 'Request failed';
    setters.setError(message);
  }, [setters, submissionsQuery.error]);

  const reload = useCallback(
    async (opts?: { skipCache?: boolean }) => {
      pendingOptsRef.current = opts ?? null;
      setters.setArtifactWarning(null);
      setters.setError(null);
      setters.setLoading(true);

      try {
        if (opts?.skipCache) {
          await queryClient.invalidateQueries({
            queryKey,
            refetchType: 'none',
          });
          await queryClient.fetchQuery({
            queryKey,
            queryFn: ({ signal }) => runLoad(signal, true),
            staleTime: 0,
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey,
            refetchType: 'none',
          });
          await queryClient.fetchQuery({
            queryKey,
            queryFn: ({ signal }) => runLoad(signal, false),
            staleTime: 0,
          });
        }
      } catch {}
    },
    [queryClient, queryKey, runLoad, setters],
  );

  useEffect(() => {
    showAllRef.current = showAll;
  }, [showAll]);

  useEffect(
    () => () => {
      void queryClient.cancelQueries({ queryKey });
    },
    [queryClient, queryKey],
  );

  const toggleShowAll = useCallback(() => {
    const next = !showAllRef.current;
    showAllRef.current = next;
    setters.setShowAll(next);
  }, [setters]);

  useEffect(() => {
    setters.setLoading(
      submissionsQuery.isLoading ||
        (submissionsQuery.isFetching && !submissionsQuery.data),
    );
  }, [
    setters,
    submissionsQuery.data,
    submissionsQuery.isFetching,
    submissionsQuery.isLoading,
  ]);

  return { reload, toggleShowAll, setArtifacts: setters.setArtifacts };
}
