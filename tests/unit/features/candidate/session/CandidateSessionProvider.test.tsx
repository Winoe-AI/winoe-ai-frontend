import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  CandidateSessionProvider,
  useCandidateSession,
} from '@/features/candidate/session/CandidateSessionProvider';
import { BRAND_SLUG } from '@/lib/brand';

const renderWithProvider = () =>
  renderHook(() => useCandidateSession(), {
    wrapper: ({ children }) => (
      <CandidateSessionProvider>{children}</CandidateSessionProvider>
    ),
  });

describe('CandidateSessionProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionStorage.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  const storageKey = `${BRAND_SLUG}:candidate_session_v1`;

  it('restores persisted invite, session id, bootstrap, and started flag', () => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        candidateSessionId: 9,
        bootstrap: {
          candidateSessionId: 9,
          status: 'in_progress',
          simulation: { title: 'Sim', role: 'Role' },
        },
        started: true,
      }),
    );

    const { result } = renderWithProvider();
    expect(result.current.state.inviteToken).toBeNull();
    expect(result.current.state.candidateSessionId).toBe(9);
    expect(result.current.state.bootstrap?.simulation.title).toBe('Sim');
    expect(result.current.state.started).toBe(true);
  });

  it('persists minimal state on changes', () => {
    const { result } = renderWithProvider();
    act(() => {
      result.current.setInviteToken('new');
      result.current.setCandidateSessionId(7);
      result.current.setBootstrap({
        candidateSessionId: 7,
        status: 'in_progress',
        simulation: { title: 'T', role: 'R' },
      });
      result.current.setStarted(true);
    });
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}');
    expect(stored.inviteToken).toBeUndefined();
    expect(stored.candidateSessionId).toBe(7);
    expect(stored.started).toBe(true);
  });
});
