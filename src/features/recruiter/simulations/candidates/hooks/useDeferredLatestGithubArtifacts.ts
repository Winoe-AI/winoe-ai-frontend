import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { SubmissionArtifact } from '../types';
import { fetchArtifactsWithLimit } from '../utils/candidateSubmissionsApi';

type UseDeferredLatestGithubArtifactsArgs = {
  simulationId: string;
  candidateSessionId: string;
  loading: boolean;
  showAll: boolean;
  artifacts: Record<number, SubmissionArtifact>;
  latestGithubSubmissionIds: number[];
  queryClient: QueryClient;
  setArtifacts: Dispatch<SetStateAction<Record<number, SubmissionArtifact>>>;
  setArtifactWarning: Dispatch<SetStateAction<string | null>>;
  deferredDelayMs: number;
};

export function useDeferredLatestGithubArtifacts({
  simulationId,
  candidateSessionId,
  loading,
  showAll,
  artifacts,
  latestGithubSubmissionIds,
  queryClient,
  setArtifacts,
  setArtifactWarning,
  deferredDelayMs,
}: UseDeferredLatestGithubArtifactsArgs) {
  const [latestGithubLoading, setLatestGithubLoading] = useState(false);

  useEffect(() => {
    if (loading || showAll) return;
    const missing = latestGithubSubmissionIds.filter((id) => !artifacts[id]);
    if (!missing.length) return;

    const timer = window.setTimeout(() => {
      setLatestGithubLoading(true);
      queryClient
        .fetchQuery({
          queryKey: queryKeys.recruiter.candidateSubmissionArtifacts(
            simulationId,
            candidateSessionId,
            [...missing].sort((a, b) => a - b),
          ),
          queryFn: ({ signal }) =>
            fetchArtifactsWithLimit(missing, { signal, cacheTtlMs: 10_000 }),
          staleTime: 10_000,
        })
        .then(({ results, hadError }) => {
          setArtifacts((prev) => ({ ...prev, ...results }));
          if (!hadError) {
            setArtifactWarning(null);
            return;
          }
          setArtifactWarning(
            Object.keys(results).length === 0
              ? 'Details unavailable for submissions.'
              : 'Some submission details are unavailable.',
          );
        })
        .catch(() => setArtifactWarning('Details unavailable for submissions.'))
        .finally(() => setLatestGithubLoading(false));
    }, deferredDelayMs);

    return () => {
      window.clearTimeout(timer);
      setLatestGithubLoading(false);
    };
  }, [
    artifacts,
    candidateSessionId,
    latestGithubSubmissionIds,
    loading,
    queryClient,
    setArtifactWarning,
    setArtifacts,
    showAll,
    simulationId,
    deferredDelayMs,
  ]);

  return latestGithubLoading;
}
