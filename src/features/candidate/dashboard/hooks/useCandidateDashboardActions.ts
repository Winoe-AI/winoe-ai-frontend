import { useCallback } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import {
  getCandidateCurrentTask,
  resolveCandidateInviteToken,
  type CandidateInvite,
} from '@/features/candidate/api';
import { queryKeys } from '@/shared/query';

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
  const resolveFallbackToken = useCallback(
    (invite: CandidateInvite) =>
      invite.candidateSessionId === candidateSessionId ? (inviteToken ?? null) : null,
    [candidateSessionId, inviteToken],
  );

  const handleContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired) {
        setError('This invite has expired. Please contact your recruiter.');
        return;
      }
      const token = invite.token ?? resolveFallbackToken(invite);
      if (!token) {
        setError('Invite link unavailable. Please reopen your invite email.');
        return;
      }
      router.push(`/candidate/session/${encodeURIComponent(token)}`);
    },
    [resolveFallbackToken, router, setError],
  );

  const prefetchContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired) return;
      const token = invite.token ?? resolveFallbackToken(invite);
      if (!token) return;

      void router.prefetch(`/candidate/session/${encodeURIComponent(token)}`);
      void queryClient
        .fetchQuery({
          queryKey: queryKeys.candidate.sessionBootstrap(token),
          queryFn: ({ signal }) =>
            resolveCandidateInviteToken(token, { signal, skipCache: false }),
          staleTime: 10_000,
        })
        .then((bootstrap) => {
          const sessionId = bootstrap?.candidateSessionId;
          if (typeof sessionId !== 'number' || !Number.isFinite(sessionId)) return;
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
    [queryClient, resolveFallbackToken, router],
  );

  return { resolveFallbackToken, handleContinue, prefetchContinue };
}
