import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateSessionProvider,
  useCandidateSession,
} from '@/features/candidate/session/CandidateSessionProvider';
import { BRAND_SLUG } from '@/lib/brand';

const STORAGE_KEY = `${BRAND_SLUG}:candidate_session_v1`;

function setSessionPath(token: string) {
  window.history.replaceState(
    {},
    '',
    `/candidate/session/${encodeURIComponent(token)}`,
  );
}

function Harness() {
  const {
    state,
    setInviteToken,
    setCandidateSessionId,
    setStarted,
    setTaskLoading,
    setTaskError,
    clearTaskError,
    setTaskLoaded,
    reset,
  } = useCandidateSession();

  return (
    <div>
      <div data-testid="invite-token">{state.inviteToken ?? 'none'}</div>
      <div data-testid="candidate-session-id">
        {state.candidateSessionId ?? 'none'}
      </div>
      <div data-testid="auth-status">{state.authStatus}</div>
      <div data-testid="started">{String(state.started)}</div>
      <div data-testid="task-error">{state.taskState.error ?? 'none'}</div>
      <button onClick={() => setInviteToken('invite_tok')}>set-invite</button>
      <button onClick={() => setCandidateSessionId(42)}>set-session</button>
      <button onClick={() => setStarted(true)}>start</button>
      <button
        onClick={() => {
          setTaskLoading();
          setTaskLoaded({
            isComplete: false,
            completedTaskIds: [1],
            currentTask: null,
          });
        }}
      >
        load-task
      </button>
      <button
        onClick={() => {
          setTaskError('boom');
        }}
      >
        err
      </button>
      <button onClick={() => clearTaskError()}>clear-err</button>
      <button onClick={() => reset()}>reset</button>
    </div>
  );
}

async function renderHarness() {
  await act(async () => {
    render(
      <CandidateSessionProvider>
        <Harness />
      </CandidateSessionProvider>,
    );
    await Promise.resolve();
  });
  await waitFor(() =>
    expect(screen.getByTestId('auth-status')).toHaveTextContent('idle'),
  );
}

describe('CandidateSessionProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setSessionPath('invite_tok');
  });

  it('restores persisted session/bootstrap/started state from sessionStorage', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        inviteToken: 'invite_tok',
        candidateSessionId: 55,
        bootstrap: {
          candidateSessionId: 10,
          status: 'in_progress',
          simulation: { title: 'Sim', role: 'Backend' },
        },
        started: true,
        taskState: {
          isComplete: false,
          completedTaskIds: [1],
          currentTask: {
            id: 9,
            dayIndex: 1,
            type: 'design',
            title: 'Persisted Task',
            description: 'Persisted Description',
          },
        },
      }),
    );

    await renderHarness();

    expect(screen.getByTestId('invite-token')).toHaveTextContent('invite_tok');
    expect(screen.getByTestId('candidate-session-id')).toHaveTextContent('55');
    expect(screen.getByTestId('started')).toHaveTextContent('true');
  });

  it('persists updates to sessionStorage when state changes', async () => {
    await renderHarness();

    fireEvent.click(screen.getByText('set-invite'));
    fireEvent.click(screen.getByText('set-session'));
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('load-task'));

    const persisted = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persisted.inviteToken).toBe('invite_tok');
    expect(persisted.token).toBeUndefined();
    expect(persisted.candidateSessionId).toBe(42);
    expect(persisted.started).toBe(true);
    expect(persisted.taskState).toEqual({
      isComplete: false,
      completedTaskIds: [1],
      currentTask: null,
    });
  });

  it('handles storage errors gracefully without throwing', async () => {
    const getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });

    await expect(renderHarness()).resolves.not.toThrow();
    getItemSpy.mockRestore();
  });

  it('does not hydrate persisted state when route token does not match', async () => {
    setSessionPath('new_token');
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        inviteToken: 'old_token',
        candidateSessionId: 99,
        bootstrap: {
          candidateSessionId: 99,
          status: 'in_progress',
          simulation: { title: 'Stale', role: 'Stale' },
        },
        started: true,
        taskState: {
          isComplete: false,
          completedTaskIds: [1],
          currentTask: {
            id: 9,
            dayIndex: 1,
            type: 'design',
            title: 'Stale Task',
            description: 'Stale description',
          },
        },
      }),
    );

    await renderHarness();

    expect(screen.getByTestId('invite-token')).toHaveTextContent('none');
    expect(screen.getByTestId('candidate-session-id')).toHaveTextContent(
      'none',
    );
    expect(screen.getByTestId('started')).toHaveTextContent('false');
    const persisted = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persisted.inviteToken).toBeNull();
    expect(persisted.candidateSessionId).toBeNull();
  });

  it('can set and clear task errors via context helpers', async () => {
    await renderHarness();

    fireEvent.click(screen.getByText('err'));
    expect(screen.getByTestId('task-error')).toHaveTextContent('boom');

    fireEvent.click(screen.getByText('clear-err'));
    expect(screen.getByTestId('task-error')).toHaveTextContent('none');
  });

  it('resets state back to initial values', async () => {
    await renderHarness();

    fireEvent.click(screen.getByText('set-invite'));
    fireEvent.click(screen.getByText('reset'));

    expect(screen.getByTestId('invite-token')).toHaveTextContent('none');
    expect(screen.getByTestId('started')).toHaveTextContent('false');
    await waitFor(() =>
      expect(screen.getByTestId('auth-status')).toHaveTextContent('idle'),
    );
  });
});
