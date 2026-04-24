import { useCallback } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import {
  getCandidateCompletedReview,
  getCandidateCurrentTask,
  resolveCandidateInviteToken,
  type CandidateInvite,
} from '@/features/candidate/session/api';
import { queryKeys } from '@/shared/query';
import {
  isTerminatedInvite,
  isReviewRouteInvite,
} from '../utils/candidateInviteViewModel';

type RouterLike = {
  push: (href: string) => void;
  prefetch: (href: string) => Promise<void> | void;
};

type Params = {
  router: RouterLike;
  queryClient: QueryClient;
  candidateSessionId: number | null;
  inviteToken: string | null;
  setError: (message: string | null) => void;
};

export function useCandidateDashboardActions({
  router,
  queryClient,
  candidateSessionId,
  inviteToken,
  setError,
}: Params) {
  const shouldRouteToReview = useCallback(
    (invite: CandidateInvite) => isReviewRouteInvite(invite),
    [],
  );

  const resolveDestination = useCallback(
    (invite: CandidateInvite, token: string) =>
      shouldRouteToReview(invite)
        ? `/candidate/session/${encodeURIComponent(token)}/review`
        : `/candidate/session/${encodeURIComponent(token)}`,
    [shouldRouteToReview],
  );

  const resolveFallbackToken = useCallback(
    (invite: CandidateInvite) =>
      invite.candidateSessionId === candidateSessionId
        ? (inviteToken ?? null)
        : null,
    [candidateSessionId, inviteToken],
  );

  const handleContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired) {
        setError(
          'This invite has expired. Please contact your Talent Partner.',
        );
        return;
      }
      if (isTerminatedInvite(invite)) {
        setError('This trial has ended. Please contact your Talent Partner.');
        return;
      }
      const token = invite.token ?? resolveFallbackToken(invite);
      if (!token) {
        setError('Invite link unavailable. Please reopen your invite email.');
        return;
      }
      router.push(resolveDestination(invite, token));
    },
    [resolveDestination, resolveFallbackToken, router, setError],
  );

  const prefetchContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired || isTerminatedInvite(invite)) return;
      const token = invite.token ?? resolveFallbackToken(invite);
      if (!token) return;
      const destination = resolveDestination(invite, token);

      void router.prefetch(destination);
      if (shouldRouteToReview(invite)) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.candidate.sessionReview(token),
          queryFn: ({ signal }) =>
            getCandidateCompletedReview(token, { signal, skipCache: false }),
          staleTime: 10_000,
        });
        return;
      }
      void queryClient
        .fetchQuery({
          queryKey: queryKeys.candidate.sessionBootstrap(token),
          queryFn: ({ signal }) =>
            resolveCandidateInviteToken(token, { signal, skipCache: false }),
          staleTime: 10_000,
        })
        .then((bootstrap) => {
          const sessionId = bootstrap?.candidateSessionId;
          if (typeof sessionId !== 'number' || !Number.isFinite(sessionId))
            return;
          return queryClient.prefetchQuery({
            queryKey: queryKeys.candidate.currentTask(sessionId),
            queryFn: ({ signal }) =>
              getCandidateCurrentTask(sessionId, {
                signal,
                skipCache: false,
                cacheTtlMs: 10_000,
                dedupeKey: `candidate-current-task-${sessionId}`,
              }),
            staleTime: 10_000,
          });
        })
        .catch(() => {});
    },
    [
      queryClient,
      resolveDestination,
      resolveFallbackToken,
      router,
      shouldRouteToReview,
    ],
  );

  return { resolveFallbackToken, handleContinue, prefetchContinue };
}
