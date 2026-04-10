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
  submitTaskMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.handlers.testlib';

describe('CandidateSessionPage handlers - submit and error flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeHandlerApiMocks();
  });

  it('submits current task and refreshes progress after delay', async () => {
    jest.useFakeTimers();
    useCandidateSessionMock.mockReturnValue(baseState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(await screen.findByTestId('submit-btn'));
    await act(async () => {
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
    });
    expect(submitTaskMock).toHaveBeenCalledWith({
      taskId: 1,
      candidateSessionId: 99,
      contentText: undefined,
    });
    await waitFor(() =>
      expect(
        getCurrentTaskMock.mock.calls.some(
          (call) => (call[1] as { skipCache?: boolean } | undefined)?.skipCache,
        ),
      ).toBe(true),
    );
    jest.useRealTimers();
  });

  it('shows error when start fetch fails after clicking start', async () => {
    getCurrentTaskMock.mockRejectedValueOnce({
      status: 500,
      message: 'task boom',
    });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        started: false,
        taskState: {
          loading: true,
          error: null,
          isComplete: false,
          completedTaskIds: [],
          currentTask: null,
        },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', { name: /Start trial/i }),
      );
      await Promise.resolve();
    });
    expect(await screen.findByTestId('state-message')).toHaveTextContent(
      /Unable to load trial/i,
    );
  });

  it('handles task fetch failure during bootstrap', async () => {
    getCurrentTaskMock.mockRejectedValue({ status: 500 });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        started: true,
        taskState: {
          loading: false,
          error: null,
          isComplete: false,
          completedTaskIds: [],
          currentTask: null,
        },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });

  it('transitions from starting view to running when tasks load', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue({
      ...state,
      state: {
        ...state.state,
        started: true,
        taskState: {
          ...state.state.taskState,
          loading: false,
          currentTask: null,
        },
      },
    });
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });
});
