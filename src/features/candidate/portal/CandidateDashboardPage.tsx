'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { buildLoginHref } from '@/features/auth/authPaths';
import { useCandidateSession } from '../session/CandidateSessionProvider';
import { DashboardHeader } from './components/DashboardHeader';
import { InviteList } from './components/InviteList';
import { useCandidateDashboardActions } from './hooks/useCandidateDashboardActions';
import { useCandidateInvites } from './hooks/useCandidateInvites';
import { extractInviteToken } from './utils/inviteTokensUtils';

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
    useCandidateInvites(signedInEmail ?? null, handleAuthRequired);

  const displayEmail = useMemo(() => signedInEmail ?? '', [signedInEmail]);
  const { handleContinue, prefetchContinue, resolveFallbackToken } =
    useCandidateDashboardActions({
      router,
      queryClient,
      candidateSessionId: state.candidateSessionId,
      inviteToken: state.inviteToken,
      setError,
    });

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
