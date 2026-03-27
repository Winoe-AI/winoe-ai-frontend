import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  primeErrorApiMocks,
  routerMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.error.testlib';

describe('CandidateSessionPage error states - fallback and navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeErrorApiMocks();
    routerMock.push.mockReset();
  });

  it('shows session not ready when candidateSessionId is null with currentTask', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        candidateSessionId: null,
        bootstrap: null,
        taskState: { ...state.state.taskState, currentTask: { id: 1, dayIndex: 1, type: 'design', title: 'Task', description: '' } },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByText(/Session not ready/i)).toBeInTheDocument());
  });

  it('shows fallback when no current task and no session', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({ ...state, state: { ...state.state, taskState: { ...state.state.taskState, currentTask: null } } });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByText(/Unable to load your session/i)).toBeInTheDocument());
  });

  it('navigates to candidate dashboard on back button click', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({ ...state, state: { ...state.state, taskState: { ...state.state.taskState, currentTask: null } } });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByText(/Unable to load your session/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Back to dashboard/i }));
    expect(routerMock.push).toHaveBeenCalledWith('/candidate/dashboard');
  });

  it('resets state when inviteToken changes', async () => {
    const resetMock = jest.fn();
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({ ...state, state: { ...state.state, inviteToken: 'old-token' }, reset: resetMock });
    render(<CandidateSessionPage token="new-token" />);
    await act(async () => Promise.resolve());
    expect(resetMock).toHaveBeenCalled();
  });
});
