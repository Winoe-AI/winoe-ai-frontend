import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  getCurrentTaskMock,
  primeErrorApiMocks,
  resolveInviteMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.error.testlib';

describe('CandidateSessionPage error states - task fetch failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeErrorApiMocks();
  });

  it('catches fetchCurrentTask error from useEffect', async () => {
    const state = baseState();
    getCurrentTaskMock.mockRejectedValue({ status: 500 });
    useCandidateSessionMock.mockReturnValue({
      ...state,
      setTaskError: jest.fn(),
      state: { ...state.state, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('state-message')).toHaveTextContent('Unable to load simulation'));
  });

  it('handles task fetch error after successful bootstrap', async () => {
    resolveInviteMock.mockResolvedValue({ candidateSessionId: 99, status: 'in_progress', simulation: { title: 'Sim', role: 'Role' } });
    getCurrentTaskMock.mockRejectedValue({ status: 500 });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, started: true, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });

  it('triggers task fetch on handleStart when no current task', async () => {
    getCurrentTaskMock.mockRejectedValueOnce({ status: 500 });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      setStarted: jest.fn(),
      state: { ...state.state, started: false, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(resolveInviteMock).toHaveBeenCalled());
  });

  it('retry in no-task fallback calls fetchCurrentTask again', async () => {
    getCurrentTaskMock.mockRejectedValue({ status: 500 });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, started: true, taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [], currentTask: null } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByText(/Unable to load simulation/i)).toBeInTheDocument());
    const initialCallCount = getCurrentTaskMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    await waitFor(() => expect(getCurrentTaskMock.mock.calls.length).toBeGreaterThan(initialCallCount));
    expect(getCurrentTaskMock.mock.calls.at(-1)?.[0]).toBe(99);
  });
});
