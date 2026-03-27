import { act, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  primeErrorApiMocks,
  resolveInviteMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.error.testlib';

describe('CandidateSessionPage error states - view state coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeErrorApiMocks();
  });

  it('shows day 3 workspace panel for debug task', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { ...state.state.taskState, currentTask: { id: 2, dayIndex: 3, type: 'debug', title: 'Debug Day', description: '' } } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByTestId('workspace-panel')).toBeInTheDocument());
  });

  it('displays loading indicator during task refresh', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { ...state.state.taskState, loading: true } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByText(/Refreshing/i)).toBeInTheDocument());
  });

  it('does not retry init when done and same token', async () => {
    resolveInviteMock.mockResolvedValue({ candidateSessionId: 99, status: 'in_progress', simulation: { title: 'Sim', role: 'Role' } });
    useCandidateSessionMock.mockReturnValue(buildState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(resolveInviteMock).toHaveBeenCalledTimes(1));
    await act(async () => Promise.resolve());
    expect(resolveInviteMock).toHaveBeenCalledTimes(1);
  });
});
