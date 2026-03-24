import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { useCandidateSubmissionsData } from './useCandidateSubmissionsData';
import { useSubmissionPagination } from './useSubmissionPagination';
import { useArtifactsForPage } from './useArtifactsForPage';
import { fetchArtifactsWithLimit } from '../utils/candidateSubmissionsApi';
import { isHandoffSubmissionItem } from '../utils/handoff';
import { pickLatestByDay, pickLatestWhere } from '../utils/pickLatest';

const PAGE_SIZE = 8;
const DEFERRED_LATEST_GITHUB_FETCH_DELAY_MS = 0;
const DEFERRED_DAY4_FETCH_DELAY_MS = 0;

export function useCandidateSubmissions(
  simulationId: string,
  candidateSessionId: string,
) {
  const queryClient = useQueryClient();
  const { state, actions, setShowAll } = useCandidateSubmissionsData(
    simulationId,
    candidateSessionId,
    PAGE_SIZE,
  );
  const pagination = useSubmissionPagination(state.items, PAGE_SIZE);
  const setArtifacts = actions.setArtifacts;
  const setArtifactWarning = actions.setArtifactWarning;
  const [latestGithubLoading, setLatestGithubLoading] = useState(false);
  const [latestDay4Loading, setLatestDay4Loading] = useState(false);
  const latestGithubSubmissionIds = useMemo(() => {
    const latestDay2 = pickLatestByDay(state.items, 2)?.submissionId ?? null;
    const latestDay3 = pickLatestByDay(state.items, 3)?.submissionId ?? null;
    return [latestDay2, latestDay3].filter(
      (id): id is number => typeof id === 'number',
    );
  }, [state.items]);
  const latestDay4SubmissionId = useMemo(
    () =>
      pickLatestWhere(state.items, isHandoffSubmissionItem)?.submissionId ??
      null,
    [state.items],
  );

  useArtifactsForPage({
    simulationId,
    candidateSessionId,
    showAll: state.showAll,
    pagedItems: pagination.pagedItems,
    artifacts: state.artifacts,
    setArtifacts,
  });

  useEffect(() => {
    if (state.loading || state.showAll) {
      return;
    }

    const missing = latestGithubSubmissionIds.filter(
      (id) => !state.artifacts[id],
    );
    if (!missing.length) {
      return;
    }

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
            fetchArtifactsWithLimit(missing, {
              signal,
              cacheTtlMs: 10_000,
            }),
          staleTime: 10_000,
        })
        .then(({ results, hadError }) => {
          setArtifacts((prev) => ({ ...prev, ...results }));
          if (!hadError) {
            setArtifactWarning(null);
            return;
          }
          const warning =
            Object.keys(results).length === 0
              ? 'Details unavailable for submissions.'
              : 'Some submission details are unavailable.';
          setArtifactWarning(warning);
        })
        .catch(() => {
          setArtifactWarning('Details unavailable for submissions.');
        })
        .finally(() => {
          setLatestGithubLoading(false);
        });
    }, DEFERRED_LATEST_GITHUB_FETCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      setLatestGithubLoading(false);
    };
  }, [
    candidateSessionId,
    latestGithubSubmissionIds,
    queryClient,
    setArtifactWarning,
    setArtifacts,
    state.artifacts,
    state.loading,
    state.showAll,
    simulationId,
  ]);

  useEffect(() => {
    if (state.loading || state.showAll || latestDay4SubmissionId == null) {
      return;
    }
    if (state.artifacts[latestDay4SubmissionId]) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLatestDay4Loading(true);
      queryClient
        .fetchQuery({
          queryKey: queryKeys.recruiter.candidateSubmissionArtifacts(
            simulationId,
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
        .then(({ results }) => {
          setArtifacts((prev) => ({ ...prev, ...results }));
        })
        .catch(() => {})
        .finally(() => {
          setLatestDay4Loading(false);
        });
    }, DEFERRED_DAY4_FETCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      setLatestDay4Loading(false);
    };
  }, [
    candidateSessionId,
    latestDay4SubmissionId,
    queryClient,
    setArtifacts,
    state.artifacts,
    state.loading,
    state.showAll,
    simulationId,
  ]);

  const reload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [
        'recruiter',
        'simulations',
        simulationId,
        'candidate-sessions',
        candidateSessionId,
        'submission-artifacts',
      ],
      refetchType: 'none',
    });
    void actions.reload();
  }, [actions, candidateSessionId, queryClient, simulationId]);

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
