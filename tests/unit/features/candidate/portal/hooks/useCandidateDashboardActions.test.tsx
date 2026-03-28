import { renderHook, waitFor } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';
import { useCandidateDashboardActions } from '@/features/candidate/portal/hooks/useCandidateDashboardActions';

const resolveCandidateInviteTokenMock = jest.fn();
const getCandidateCurrentTaskMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) =>
    resolveCandidateInviteTokenMock(...args),
  getCandidateCurrentTask: (...args: unknown[]) =>
    getCandidateCurrentTaskMock(...args),
}));

describe('useCandidateDashboardActions', () => {
  const setError = jest.fn();
  const router = {
    push: jest.fn(),
    prefetch: jest.fn(),
  };

  const queryClient = {
    fetchQuery: jest.fn(),
    prefetchQuery: jest.fn(),
  } as unknown as QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    (queryClient.fetchQuery as jest.Mock).mockImplementation(
      async ({ queryFn }: { queryFn: (ctx: { signal?: AbortSignal }) => any }) =>
        queryFn({ signal: undefined }),
    );
    (queryClient.prefetchQuery as jest.Mock).mockImplementation(
      async ({ queryFn }: { queryFn: (ctx: { signal?: AbortSignal }) => any }) =>
        queryFn({ signal: undefined }),
    );
  });

  it('resolves fallback token only for matching session', () => {
    const { result } = renderHook(() =>
      useCandidateDashboardActions({
        router,
        queryClient,
        candidateSessionId: 9,
        inviteToken: 'fallback-token',
        setError,
      }),
    );

    expect(
      result.current.resolveFallbackToken({
        candidateSessionId: 9,
      } as never),
    ).toBe('fallback-token');
    expect(
      result.current.resolveFallbackToken({
        candidateSessionId: 10,
      } as never),
    ).toBeNull();
  });

  it('surfaces expired invite and missing-token errors in handleContinue', () => {
    const { result } = renderHook(() =>
      useCandidateDashboardActions({
        router,
        queryClient,
        candidateSessionId: 9,
        inviteToken: null,
        setError,
      }),
    );

    result.current.handleContinue({ isExpired: true } as never);
    expect(setError).toHaveBeenCalledWith(
      'This invite has expired. Please contact your recruiter.',
    );

    result.current.handleContinue({ isExpired: false, token: null } as never);
    expect(setError).toHaveBeenCalledWith(
      'Invite link unavailable. Please reopen your invite email.',
    );
  });

  it('navigates to encoded token path when continue succeeds', () => {
    const { result } = renderHook(() =>
      useCandidateDashboardActions({
        router,
        queryClient,
        candidateSessionId: 9,
        inviteToken: null,
        setError,
      }),
    );

    result.current.handleContinue({
      isExpired: false,
      token: 'token with spaces',
    } as never);

    expect(router.push).toHaveBeenCalledWith(
      '/candidate/session/token%20with%20spaces',
    );
  });

  it('prefetches bootstrap and current task for active invite token', async () => {
    resolveCandidateInviteTokenMock.mockResolvedValue({ candidateSessionId: 9 });
    getCandidateCurrentTaskMock.mockResolvedValue({
      isComplete: false,
      completedTaskIds: [],
      currentTask: null,
    });

    const { result } = renderHook(() =>
      useCandidateDashboardActions({
        router,
        queryClient,
        candidateSessionId: 9,
        inviteToken: 'fallback-token',
        setError,
      }),
    );

    result.current.prefetchContinue({
      isExpired: false,
      token: 'invite-token-9',
      candidateSessionId: 9,
    } as never);

    await waitFor(() => {
      expect(router.prefetch).toHaveBeenCalledWith(
        '/candidate/session/invite-token-9',
      );
      expect(resolveCandidateInviteTokenMock).toHaveBeenCalledWith(
        'invite-token-9',
        expect.objectContaining({ skipCache: false }),
      );
      expect(getCandidateCurrentTaskMock).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ skipCache: false, cacheTtlMs: 10_000 }),
      );
    });
  });

  it('silently swallows prefetch errors', async () => {
    (queryClient.fetchQuery as jest.Mock).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useCandidateDashboardActions({
        router,
        queryClient,
        candidateSessionId: 9,
        inviteToken: null,
        setError,
      }),
    );

    expect(() => {
      result.current.prefetchContinue({
        isExpired: false,
        token: 'invite-token-9',
      } as never);
    }).not.toThrow();

    await waitFor(() => {
      expect(queryClient.fetchQuery).toHaveBeenCalledTimes(1);
    });
    expect(queryClient.prefetchQuery).not.toHaveBeenCalled();
  });
});
