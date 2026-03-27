import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchArtifactsWithLimit } from '../utils/candidateSubmissionsApiUtils';
import type { SubmissionArtifact, SubmissionListItem } from '../types';

type Params = {
  simulationId: string;
  candidateSessionId: string;
  showAll: boolean;
  pagedItems: SubmissionListItem[];
  artifacts: Record<number, SubmissionArtifact>;
  setArtifacts: React.Dispatch<
    React.SetStateAction<Record<number, SubmissionArtifact>>
  >;
};

export function useArtifactsForPage({
  simulationId,
  candidateSessionId,
  showAll,
  pagedItems,
  artifacts,
  setArtifacts,
}: Params) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!showAll) return;
    const missing = pagedItems
      .map((it) => it.submissionId)
      .filter((id) => !artifacts[id])
      .sort((a, b) => a - b);
    if (!missing.length) return;

    void queryClient
      .fetchQuery({
        queryKey: queryKeys.recruiter.candidateSubmissionArtifacts(
          simulationId,
          candidateSessionId,
          missing,
        ),
        queryFn: ({ signal }) =>
          fetchArtifactsWithLimit(missing, {
            signal,
            cacheTtlMs: 10_000,
          }),
        staleTime: 10_000,
      })
      .then(({ results }) => {
        setArtifacts((prev) => ({ ...prev, ...results }));
      })
      .catch(() => {});
  }, [
    artifacts,
    candidateSessionId,
    pagedItems,
    queryClient,
    setArtifacts,
    showAll,
    simulationId,
  ]);
}
