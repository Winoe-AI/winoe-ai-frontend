import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateTaskView,
  baseTask,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  putCandidateTaskDraftMock,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView task switch remount behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    primeDraftMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resets task-local state and hydrates new task drafts on task switch', async () => {
    putCandidateTaskDraftMock.mockReturnValue(
      new Promise<{ taskId: number; updatedAt: string }>(() => {}),
    );
    getCandidateTaskDraftMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        taskId: 3,
        contentText: 'Recovered task 3 draft',
        contentJson: null,
        updatedAt: '2026-03-07T09:45:00.000Z',
        finalizedAt: null,
        finalizedSubmissionId: null,
      });

    const { rerender } = render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{ ...baseTask, id: 1 }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );
    await waitFor(() =>
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        candidateSessionId: 22,
        taskId: 1,
      }),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Task 1 draft text' },
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();

    rerender(
      <CandidateTaskView
        candidateSessionId={22}
        task={{ ...baseTask, id: 2 }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );
    await waitFor(() =>
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        candidateSessionId: 22,
        taskId: 2,
      }),
    );
    expect(screen.queryByText(/Saving/i)).toBeNull();
    expect(screen.queryByDisplayValue('Task 1 draft text')).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('');

    rerender(
      <CandidateTaskView
        candidateSessionId={22}
        task={{ ...baseTask, id: 3 }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Recovered task 3 draft'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/Draft restored/i)).toBeInTheDocument();
  });
});
