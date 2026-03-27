import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  renderHarness,
  setSessionPath,
  STORAGE_KEY,
} from './CandidateSessionProvider.testlib';

describe('CandidateSessionProvider state helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setSessionPath('invite_tok');
  });

  it('does not hydrate persisted state when route token does not match', async () => {
    setSessionPath('new_token');
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        inviteToken: 'old_token',
        candidateSessionId: 99,
        bootstrap: { candidateSessionId: 99, status: 'in_progress', simulation: { title: 'Stale', role: 'Stale' } },
        started: true,
        taskState: {
          isComplete: false,
          completedTaskIds: [1],
          currentTask: { id: 9, dayIndex: 1, type: 'design', title: 'Stale Task', description: 'Stale description' },
        },
      }),
    );

    await renderHarness();
    expect(screen.getByTestId('invite-token')).toHaveTextContent('none');
    expect(screen.getByTestId('candidate-session-id')).toHaveTextContent('none');
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
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('idle'));
  });
});
