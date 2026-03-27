import { fireEvent, screen } from '@testing-library/react';
import {
  renderHarness,
  setSessionPath,
  STORAGE_KEY,
} from './CandidateSessionProvider.testlib';

describe('CandidateSessionProvider persistence', () => {
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
});
