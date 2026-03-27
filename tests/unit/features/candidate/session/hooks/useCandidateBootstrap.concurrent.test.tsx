import { act, renderHook } from '@testing-library/react';
import {
  resetCandidateBootstrapMocks,
  resolveCandidateInviteTokenMock,
} from './useCandidateBootstrap.testlib';
import { useCandidateBootstrap } from '@/features/candidate/session/hooks/useCandidateBootstrap';

describe('useCandidateBootstrap request dedupe', () => {
  beforeEach(() => {
    resetCandidateBootstrapMocks();
  });

  it('deduplicates concurrent requests for the same token', async () => {
    let resolvePromise: ((data: unknown) => void) | null = null;
    resolveCandidateInviteTokenMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useCandidateBootstrap({
        inviteToken: 'same-token',
        onResolved: jest.fn(),
      }),
    );
    void act(() => {
      void result.current.load();
    });
    void act(() => {
      void result.current.load();
    });
    expect(resolveCandidateInviteTokenMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise?.({ candidateSessionId: 123 });
    });
    expect(result.current.state).toBe('ready');
  });

  it('allows a new request after previous one completes', async () => {
    resolveCandidateInviteTokenMock
      .mockResolvedValueOnce({ candidateSessionId: 1 })
      .mockResolvedValueOnce({ candidateSessionId: 2 });

    const onResolved = jest.fn();
    const { result, rerender } = renderHook(
      ({ token }) => useCandidateBootstrap({ inviteToken: token, onResolved }),
      { initialProps: { token: 'token-1' } },
    );

    await act(async () => {
      await result.current.load();
    });
    expect(onResolved).toHaveBeenCalledWith({ candidateSessionId: 1 });

    rerender({ token: 'token-2' });
    await act(async () => {
      await result.current.load();
    });
    expect(resolveCandidateInviteTokenMock).toHaveBeenCalledTimes(2);
    expect(onResolved).toHaveBeenLastCalledWith({ candidateSessionId: 2 });
  });
});
