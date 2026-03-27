import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  getCurrentTaskMock,
  primeViewApiMocks,
  routerMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.view.testlib';

describe('CandidateSessionPage view - completion and start state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeViewApiMocks();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
  });

  it('shows completion message when tasks are complete', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { ...state.state.taskState, isComplete: true } },
    }));
    render(<CandidateSessionPage token="inv" />);
    await waitFor(() => expect(screen.getByTestId('state-message')).toHaveTextContent('Simulation complete'));
  });

  it('renders start view and triggers start fetch when not started', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, started: false, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(screen.getByRole('button', { name: /Start simulation/i }));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });

  it('navigates to candidate dashboard from start view back button', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, started: false, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(screen.getByRole('button', { name: /Back to Candidate Dashboard/i }));
    expect(routerMock.push).toHaveBeenCalledWith('/candidate/dashboard');
  });
});
