import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { SubmissionArtifact } from '../types';
import { fetchArtifactsWithLimit } from '../utils/candidateSubmissionsApiUtils';

function hasCompleteDay4Artifact(artifact: SubmissionArtifact | undefined) {
  const handoff = artifact?.handoff ?? null;
  const transcript = handoff?.transcript ?? null;
  return Boolean(
    handoff?.downloadUrl &&
    transcript?.status &&
    (transcript.text !== undefined || transcript.segments !== undefined),
  );
}

type UseDeferredLatestDay4ArtifactArgs = {
  trialId: string;
  candidateSessionId: string;
  loading: boolean;
  showAll: boolean;
  artifacts: Record<number, SubmissionArtifact>;
  latestDay4SubmissionId: number | null;
  queryClient: QueryClient;
  setArtifacts: Dispatch<SetStateAction<Record<number, SubmissionArtifact>>>;
  deferredDelayMs: number;
};

export function useDeferredLatestDay4Artifact({
  trialId,
  candidateSessionId,
  loading,
  showAll,
  artifacts,
  latestDay4SubmissionId,
  queryClient,
  setArtifacts,
  deferredDelayMs,
}: UseDeferredLatestDay4ArtifactArgs) {
  const [latestDay4Loading, setLatestDay4Loading] = useState(false);

  useEffect(() => {
    if (loading || showAll || latestDay4SubmissionId == null) return;
    if (hasCompleteDay4Artifact(artifacts[latestDay4SubmissionId])) return;

    const timer = window.setTimeout(() => {
      setLatestDay4Loading(true);
      queryClient
        .fetchQuery({
          queryKey: queryKeys.talentPartner.candidateSubmissionArtifacts(
            trialId,
            candidateSessionId,
            [latestDay4SubmissionId],
          ),
          queryFn: ({ signal }) =>
            fetchArtifactsWithLimit([latestDay4SubmissionId], {
              signal,
              cacheTtlMs: 10_000,
            }),
          staleTime: 10_000,
        })
        .then(({ results }) =>
          Object.keys(results).length
            ? setArtifacts((prev) => ({ ...prev, ...results }))
            : undefined,
        )
        .catch(() => {})
        .finally(() => setLatestDay4Loading(false));
    }, deferredDelayMs);

    return () => {
      window.clearTimeout(timer);
      setLatestDay4Loading(false);
    };
  }, [
    artifacts,
    candidateSessionId,
    latestDay4SubmissionId,
    loading,
    queryClient,
    setArtifacts,
    showAll,
    trialId,
    deferredDelayMs,
  ]);

  return latestDay4Loading;
}
