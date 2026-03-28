import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listCandidateInvites,
  type CandidateInvite,
} from '@/features/candidate/session/api';
import { toUserMessage } from '@/platform/errors/errors';
import { queryKeys } from '@/shared/query';

type UseCandidateInvitesResult = {
  invites: CandidateInvite[];
  sortedInvites: CandidateInvite[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setError: (value: string | null) => void;
};

export function useCandidateInvites(
  onAuthRequired?: () => void,
): UseCandidateInvitesResult {
  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState<string | null>(null);

  const invitesQuery = useQuery({
    queryKey: queryKeys.candidate.invites(),
    queryFn: async ({ signal }) => {
      try {
        return await listCandidateInvites({ signal });
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) {
          onAuthRequired?.();
          return [];
        }
        throw err;
      }
    },
    staleTime: 60_000,
  });

  const invites = useMemo(() => invitesQuery.data ?? [], [invitesQuery.data]);

  const sortedInvites = useMemo(() => {
    return [...invites].sort((a, b) => {
      const aDate = a.lastActivityAt || a.expiresAt || '';
      const bDate = b.lastActivityAt || b.expiresAt || '';
      return bDate.localeCompare(aDate);
    });
  }, [invites]);

  const refresh = useCallback(() => {
    setLocalError(null);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.candidate.invites(),
    });
    void invitesQuery.refetch();
  }, [invitesQuery, queryClient]);

  const queryError = useMemo(() => {
    if (!invitesQuery.error) return null;
    return toUserMessage(
      invitesQuery.error,
      'Unable to load your invites right now.',
    );
  }, [invitesQuery.error]);

  return {
    invites,
    sortedInvites,
    loading: invitesQuery.isLoading || invitesQuery.isFetching,
    error: localError ?? queryError,
    refresh,
    setError: setLocalError,
  };
}
