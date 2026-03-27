import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  getCurrentTaskMock,
  primeViewApiMocks,
  useCandidateSessionMock,
} from './CandidateSessionPage.view.testlib';

describe('CandidateSessionPage view - resources and retry banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeViewApiMocks();
  });

  it('hides day 4 recording resource panel for handoff and shows day 5 docs', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { ...state.state.taskState, currentTask: { id: 3, dayIndex: 4, type: 'handoff', title: 'Handoff', description: 'https://record.me' } } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    expect(screen.getByTestId('task-view')).toHaveTextContent('Handoff');
    await waitFor(() => expect(screen.queryByTestId('resource-day-4-recording')).toBeNull());

    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { ...state.state.taskState, currentTask: { id: 4, dayIndex: 5, type: 'documentation', title: 'Docs', description: 'https://docs.me' } } },
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByTestId('resource-day-5-reflection')).toBeInTheDocument());
  });

  it('shows error banner with retry calling fetchCurrentTask skip cache', async () => {
    const state = baseState();
    getCurrentTaskMock.mockResolvedValue({ isComplete: false, completedTaskIds: [], currentTask: { id: 7, dayIndex: 1, type: 'design', title: 'Design', description: '' } });
    useCandidateSessionMock.mockReturnValue(buildState({
      state: { ...state.state, taskState: { loading: false, error: 'boom', isComplete: false, completedTaskIds: [], currentTask: null } },
      setTaskError: jest.fn(),
      clearTaskError: jest.fn(),
    }));
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click((await screen.findAllByRole('button', { name: /Retry/i }))[0]);
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });
});
