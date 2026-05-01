import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCandidateSubmissionsData } from './useCandidateSubmissionsData';
import { useSubmissionPagination } from './useSubmissionPagination';
import { useArtifactsForPage } from './useArtifactsForPage';
import { useCandidateLatestSubmissionIds } from './useCandidateLatestSubmissionIds';
import { useDeferredLatestDay4Artifact } from './useDeferredLatestDay4Artifact';
import { useDeferredLatestGithubArtifacts } from './useDeferredLatestGithubArtifacts';
const PAGE_SIZE = 8;
const DEFERRED_LATEST_GITHUB_FETCH_DELAY_MS = 0;
const DEFERRED_DAY4_FETCH_DELAY_MS = 0;
export function useCandidateSubmissions(
  trialId: string,
  candidateSessionId: string,
) {
  const queryClient = useQueryClient();
  const { state, actions, setShowAll } = useCandidateSubmissionsData(
    trialId,
    candidateSessionId,
    PAGE_SIZE,
  );
  const pagination = useSubmissionPagination(state.items, PAGE_SIZE);
  const { latestGithubSubmissionIds, latestDay4SubmissionId } =
    useCandidateLatestSubmissionIds(state.items);
  useArtifactsForPage({
    trialId,
    candidateSessionId,
    showAll: state.showAll,
    pagedItems: pagination.pagedItems,
    artifacts: state.artifacts,
    setArtifacts: actions.setArtifacts,
  });
  const latestGithubLoading = useDeferredLatestGithubArtifacts({
    trialId,
    candidateSessionId,
    loading: state.loading,
    showAll: state.showAll,
    artifacts: state.artifacts,
    latestGithubSubmissionIds,
    queryClient,
    setArtifacts: actions.setArtifacts,
    setArtifactWarning: actions.setArtifactWarning,
    deferredDelayMs: DEFERRED_LATEST_GITHUB_FETCH_DELAY_MS,
  });
  const latestDay4Loading = useDeferredLatestDay4Artifact({
    trialId,
    candidateSessionId,
    loading: state.loading,
    showAll: state.showAll,
    artifacts: state.artifacts,
    latestDay4SubmissionId,
    queryClient,
    setArtifacts: actions.setArtifacts,
    deferredDelayMs: DEFERRED_DAY4_FETCH_DELAY_MS,
  });
  const reload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [
        'talent_partner',
        'trials',
        trialId,
        'candidate-session',
        candidateSessionId,
        'submission-artifacts',
      ],
      refetchType: 'none',
    });
    void actions.reload();
  }, [actions, candidateSessionId, queryClient, trialId]);
  return {
    state: {
      ...state,
      page: pagination.page,
      totalPages: pagination.totalPages,
      latestGithubLoading:
        latestGithubLoading && !state.loading && !state.showAll,
      latestDay4Loading:
        latestDay4Loading &&
        !state.loading &&
        !state.showAll &&
        latestDay4SubmissionId != null &&
        !state.artifacts[latestDay4SubmissionId],
    },
    actions: {
      reload,
      setPage: (page: number) => {
        setShowAll(true);
        pagination.setPage(page);
      },
      toggleShowAll: () => {
        actions.toggleShowAll();
        if (!state.showAll) pagination.setPage(1);
      },
    },
    pagedItems: pagination.pagedItems,
    pageSize: PAGE_SIZE,
  };
}
