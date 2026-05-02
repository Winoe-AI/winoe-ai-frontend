import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  CandidateSessionProvider,
  useCandidateSession,
} from '@/features/candidate/session/CandidateSessionProvider';
import { BRAND_SLUG } from '@/platform/config/brand';
import { buildPersistedSession } from './CandidateSessionProvider.testFixtures';

const renderWithProvider = () =>
  renderHook(() => useCandidateSession(), {
    wrapper: ({ children }) => (
      <CandidateSessionProvider>{children}</CandidateSessionProvider>
    ),
  });

function setSessionPath(token: string) {
  window.history.replaceState(
    {},
    '',
    `/candidate/session/${encodeURIComponent(token)}`,
  );
}

describe('CandidateSessionProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionStorage.clear();
    setSessionPath('invite-token');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  const storageKey = `${BRAND_SLUG}:candidate_session_v1`;

  it('restores persisted invite, session id, bootstrap, and started flag', () => {
    sessionStorage.setItem(storageKey, JSON.stringify(buildPersistedSession()));

    const { result } = renderWithProvider();
    expect(result.current.state.inviteToken).toBe('invite-token');
    expect(result.current.state.candidateSessionId).toBe(9);
    expect(result.current.state.bootstrap?.trial.title).toBe('Sim');
    expect(result.current.state.started).toBe(true);
    expect(result.current.state.taskState.currentTask?.id).toBe(55);
  });

  it('persists minimal state on changes', () => {
    const { result } = renderWithProvider();
    act(() => {
      result.current.setInviteToken('new');
      result.current.setCandidateSessionId(7);
      result.current.setBootstrap({
        candidateSessionId: 7,
        status: 'in_progress',
        trial: { title: 'T', role: 'R' },
      });
      result.current.setStarted(true);
    });
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}');
    expect(stored.inviteToken).toBe('new');
    expect(stored.candidateSessionId).toBe(7);
    expect(stored.started).toBe(true);
    expect(stored.taskState).toEqual({
      isComplete: false,
      completedAt: null,
      completedTaskIds: [],
      currentTask: null,
    });
  });

  it('ignores mismatched persisted token payload on session routes', () => {
    setSessionPath('new-token');
    sessionStorage.setItem(
      storageKey,
      JSON.stringify(buildPersistedSession({ inviteToken: 'old-token' })),
    );

    const { result } = renderWithProvider();
    expect(result.current.state.inviteToken).toBeNull();
    expect(result.current.state.candidateSessionId).toBeNull();
    expect(result.current.state.started).toBe(false);
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}');
    expect(stored.inviteToken).toBeNull();
    expect(stored.candidateSessionId).toBeNull();
  });
});
