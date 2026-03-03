import { useCallback, useMemo } from 'react';
import {
  listCandidateInvites,
  type CandidateInvite,
} from '@/features/candidate/api';
import { toUserMessage } from '@/lib/errors/errors';
import { useAsyncLoader } from '@/shared/hooks';

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
  const fetchInvites = useCallback(async () => {
    try {
      return await listCandidateInvites();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        onAuthRequired?.();
        return [];
      }
      throw err;
    }
  }, [onAuthRequired]);

  const { data, loading, error, load, setError } = useAsyncLoader<
    CandidateInvite[]
  >(fetchInvites, {
    onError: (err) =>
      toUserMessage(err, 'Unable to load your invites right now.'),
  });

  const invites = useMemo(() => data ?? [], [data]);

  const sortedInvites = useMemo(() => {
    return [...invites].sort((a, b) => {
      const aDate = a.lastActivityAt || a.expiresAt || '';
      const bDate = b.lastActivityAt || b.expiresAt || '';
      return bDate.localeCompare(aDate);
    });
  }, [invites]);

  const refresh = useCallback(() => {
    void load(true);
    return () => undefined;
  }, [load]);

  return { invites, sortedInvites, loading, error, refresh, setError };
}
