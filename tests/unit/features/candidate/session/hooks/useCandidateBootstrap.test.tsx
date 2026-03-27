import { act, renderHook } from '@testing-library/react';
import {
  resetCandidateBootstrapMocks,
  resolveCandidateInviteTokenMock,
} from './useCandidateBootstrap.testlib';
import { useCandidateBootstrap } from '@/features/candidate/session/hooks/useCandidateBootstrap';

describe('useCandidateBootstrap core states', () => {
  beforeEach(() => resetCandidateBootstrapMocks());

  it('starts in idle state', () => {
    const onResolved = jest.fn();
    const { result } = renderHook(() =>
      useCandidateBootstrap({ inviteToken: null, onResolved }),
    );
    expect(result.current.state).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorStatus).toBeNull();
  });

  it('loads invite bootstrap without an access token argument', async () => {
    resolveCandidateInviteTokenMock.mockResolvedValue({ candidateSessionId: 99 });
    const onResolved = jest.fn();
    const { result } = renderHook(() => useCandidateBootstrap({ inviteToken: 'invite-token', onResolved }));
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.state).toBe('ready');
    expect(resolveCandidateInviteTokenMock).toHaveBeenCalledWith('invite-token');
  });

  it('sets error when inviteToken is missing', async () => {
    const { result } = renderHook(() => useCandidateBootstrap({ inviteToken: null, onResolved: jest.fn() }));
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.errorMessage).toBe('Missing invite token.');
    expect(result.current.errorStatus).toBeNull();
  });

  it('resolves successfully and forwards callbacks', async () => {
    const mockData = { candidateSessionId: 123, currentTask: null };
    resolveCandidateInviteTokenMock.mockResolvedValue(mockData);
    const onResolved = jest.fn();
    const onSetInviteToken = jest.fn();
    const { result } = renderHook(() => useCandidateBootstrap({ inviteToken: 'invite-token', onResolved, onSetInviteToken }));
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.state).toBe('ready');
    expect(result.current.errorMessage).toBeNull();
    expect(onSetInviteToken).toHaveBeenCalledWith('invite-token');
    expect(onResolved).toHaveBeenCalledWith(mockData);
  });

  it('handles API errors with and without status', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValueOnce({ message: 'Session expired', status: 401 });
    const one = renderHook(() =>
      useCandidateBootstrap({ inviteToken: 'invite-token', onResolved: jest.fn() }),
    );
    await act(async () => {
      await one.result.current.load();
    });
    expect(one.result.current.errorMessage).toBe('Session expired');
    expect(one.result.current.errorStatus).toBe(401);

    resolveCandidateInviteTokenMock.mockRejectedValueOnce(new Error('Network error'));
    const two = renderHook(() =>
      useCandidateBootstrap({ inviteToken: 'invite-token', onResolved: jest.fn() }),
    );
    await act(async () => {
      await two.result.current.load();
    });
    expect(two.result.current.errorMessage).toBe('Network error');
    expect(two.result.current.errorStatus).toBeNull();
  });

  it('works without onSetInviteToken callback', async () => {
    resolveCandidateInviteTokenMock.mockResolvedValue({ candidateSessionId: 1 });
    const { result } = renderHook(() => useCandidateBootstrap({ inviteToken: 'token', onResolved: jest.fn() }));
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.state).toBe('ready');
  });
});
