import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionProvider,
  useCandidateSession,
} from '@/features/candidate/session/CandidateSessionProvider';
import { BRAND_SLUG } from '@/lib/brand';

export const STORAGE_KEY = `${BRAND_SLUG}:candidate_session_v1`;

export function setSessionPath(token: string) {
  window.history.replaceState({}, '', `/candidate/session/${encodeURIComponent(token)}`);
}

function Harness() {
  const { state, setInviteToken, setCandidateSessionId, setStarted, setTaskLoading, setTaskError, clearTaskError, setTaskLoaded, reset } =
    useCandidateSession();
  return (
    <div>
      <div data-testid="invite-token">{state.inviteToken ?? 'none'}</div>
      <div data-testid="candidate-session-id">{state.candidateSessionId ?? 'none'}</div>
      <div data-testid="auth-status">{state.authStatus}</div>
      <div data-testid="started">{String(state.started)}</div>
      <div data-testid="task-error">{state.taskState.error ?? 'none'}</div>
      <button onClick={() => setInviteToken('invite_tok')}>set-invite</button>
      <button onClick={() => setCandidateSessionId(42)}>set-session</button>
      <button onClick={() => setStarted(true)}>start</button>
      <button onClick={() => { setTaskLoading(); setTaskLoaded({ isComplete: false, completedTaskIds: [1], currentTask: null }); }}>load-task</button>
      <button onClick={() => setTaskError('boom')}>err</button>
      <button onClick={() => clearTaskError()}>clear-err</button>
      <button onClick={() => reset()}>reset</button>
    </div>
  );
}

export async function renderHarness() {
  await act(async () => {
    render(
      <CandidateSessionProvider>
        <Harness />
      </CandidateSessionProvider>,
    );
    await Promise.resolve();
  });
  await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('idle'));
}
