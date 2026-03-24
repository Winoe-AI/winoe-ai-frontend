'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { buildLoginHref } from '@/features/auth/authPaths';
import {
  getCandidateCurrentTask,
  resolveCandidateInviteToken,
  type CandidateInvite,
} from '@/features/candidate/api';
import { queryKeys } from '@/shared/query';
import { useCandidateSession } from '../session/CandidateSessionProvider';
import { DashboardHeader } from './components/DashboardHeader';
import { InviteList } from './components/InviteList';
import { useCandidateInvites } from './hooks/useCandidateInvites';
import { extractInviteToken } from './utils/inviteTokens';

export { extractInviteToken };

export default function CandidateDashboardPage({
  signedInEmail,
}: {
  signedInEmail?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state } = useCandidateSession();
  const handleAuthRequired = useCallback(() => {
    router.replace(buildLoginHref('/candidate/dashboard', 'candidate'));
  }, [router]);
  const { sortedInvites, loading, error, refresh, setError } =
    useCandidateInvites(handleAuthRequired);

  const displayEmail = useMemo(() => signedInEmail ?? '', [signedInEmail]);

  const handleContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired) {
        setError('This invite has expired. Please contact your recruiter.');
        return;
      }

      const token =
        invite.token ??
        (invite.candidateSessionId === state.candidateSessionId
          ? state.inviteToken
          : null);

      if (token) {
        router.push(`/candidate/session/${encodeURIComponent(token)}`);
        return;
      }

      setError('Invite link unavailable. Please reopen your invite email.');
    },
    [router, setError, state.candidateSessionId, state.inviteToken],
  );

  const resolveFallbackToken = useCallback(
    (invite: CandidateInvite) =>
      invite.candidateSessionId === state.candidateSessionId
        ? (state.inviteToken ?? null)
        : null,
    [state.candidateSessionId, state.inviteToken],
  );

  const prefetchContinue = useCallback(
    (invite: CandidateInvite) => {
      if (invite.isExpired) return;
      const token =
        invite.token ??
        (invite.candidateSessionId === state.candidateSessionId
          ? state.inviteToken
          : null);
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
          if (typeof sessionId !== 'number' || !Number.isFinite(sessionId)) {
            return;
          }
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
    [queryClient, router, state.candidateSessionId, state.inviteToken],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <DashboardHeader email={displayEmail} />
      <InviteList
        invites={sortedInvites}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onContinue={handleContinue}
        onContinueIntent={prefetchContinue}
        resolveFallbackToken={resolveFallbackToken}
      />
    </div>
  );
}
