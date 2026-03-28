import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { LoaderSetters } from './useLoaderTypes';
import { useCandidateSubmissionsLoadActions } from './useCandidateSubmissionsLoadActions';

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
  const { applyResult, runLoad, reload } = useCandidateSubmissionsLoadActions({
    simulationId,
    candidateSessionId,
    pageSize,
    queryClient,
    queryKey,
    showAllRef,
    pendingOptsRef,
    setters,
  });

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
