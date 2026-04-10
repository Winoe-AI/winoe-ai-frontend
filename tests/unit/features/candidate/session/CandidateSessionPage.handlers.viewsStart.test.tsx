import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  getCurrentTaskMock,
  primeHandlerApiMocks,
  useCandidateSessionMock,
} from './CandidateSessionPage.handlers.testlib';

describe('CandidateSessionPage handlers - view and start flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeHandlerApiMocks();
  });

  it('shows no tests panel when session context is missing', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        candidateSessionId: null,
        token: null,
        taskState: { ...state.state.taskState, currentTask: null },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.queryByTestId('run-tests-panel')).not.toBeInTheDocument(),
    );
  });

  it('handles day 1 design task without workspace panel', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        taskState: {
          ...state.state.taskState,
          currentTask: {
            id: 1,
            dayIndex: 1,
            type: 'design' as const,
            title: 'Design Task',
            description: 'Plan the architecture',
          },
        },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByTestId('task-view')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('workspace-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('run-tests-panel')).not.toBeInTheDocument();
  });

  it('triggers handleStart and fetchCurrentTask on start button click', async () => {
    const setStarted = jest.fn();
    getCurrentTaskMock.mockResolvedValue({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 1,
        dayIndex: 1,
        type: 'design',
        title: 'Design Task',
        description: '',
      },
    });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      setStarted,
      state: {
        ...state.state,
        started: false,
        taskState: {
          ...state.state.taskState,
          currentTask: {
            id: 1,
            dayIndex: 1,
            type: 'design',
            title: 'Design Task',
            description: '',
          },
        },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(screen.getByRole('button', { name: /Start trial/i }));
    expect(setStarted).toHaveBeenCalledWith(true);
  });
});
