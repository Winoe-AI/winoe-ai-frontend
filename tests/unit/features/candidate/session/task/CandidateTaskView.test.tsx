import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import CandidateTaskView from '@/features/candidate/session/task/CandidateTaskView';
import type { Task } from '@/features/candidate/session/task/types';

const getCandidateTaskDraftMock = jest.fn();
const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/api', () => {
  const actual = jest.requireActual('@/features/candidate/api');
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      getCandidateTaskDraftMock(...args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      putCandidateTaskDraftMock(...args),
  };
});

describe('CandidateTaskView draft autosave integration', () => {
  const baseTask: Task = {
    id: 1,
    dayIndex: 1,
    type: 'design',
    title: 'Design doc',
    description: 'Write a design doc',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getCandidateTaskDraftMock.mockResolvedValue(null);
    putCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1,
      updatedAt: '2026-03-07T10:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('restores Day 1 draft on mount and shows restored messaging', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1,
      contentText: 'Recovered day 1 draft',
      contentJson: null,
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });

    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={baseTask}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Recovered day 1 draft'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Draft restored/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
  });

  it('shows Day 1 autosave status transitions from saving to saved', async () => {
    let resolvePut:
      | ((value: { taskId: number; updatedAt: string }) => void)
      | null = null;
    putCandidateTaskDraftMock.mockReturnValue(
      new Promise<{ taskId: number; updatedAt: string }>((resolve) => {
        resolvePut = resolve;
      }),
    );

    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={baseTask}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getCandidateTaskDraftMock).toHaveBeenCalled();
    });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'typing day 1...' } });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePut?.({
        taskId: 1,
        updatedAt: '2026-03-07T10:30:00.000Z',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
    });
  });

  it('restores Day 5 draft and renders save status in sticky footer', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      contentText: null,
      contentJson: { reflectionMarkdown: 'Recovered reflection' },
      updatedAt: '2026-03-07T09:30:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });

    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 5,
          dayIndex: 5,
          type: 'documentation',
          title: 'Reflection',
        }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Recovered reflection'),
      ).toBeInTheDocument();
    });

    const restored = screen.getByText(/Draft restored/i);
    expect(restored.closest('div')?.className).toContain('sticky');
    expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
  });

  it('in closed/finalized mode uses embedded recorded submission content without draft calls', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          recordedSubmission: {
            submissionId: 99,
            submittedAt: '2026-03-07T12:00:00.000Z',
            contentText: 'Finalized submission body',
          },
        }}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: true,
          disabledReason: 'Day closed.',
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Finalized submission body/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('in closed mode falls back to structured finalized content when contentText is empty', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 5,
          dayIndex: 5,
          type: 'documentation',
          recordedSubmission: {
            submissionId: 101,
            submittedAt: '2026-03-07T12:00:00.000Z',
            contentText: '',
            contentJson: {
              reflectionMarkdown: 'Final reflection body',
            },
          },
        }}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: true,
          disabledReason: 'Day closed.',
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Final reflection body/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('in closed mode prefers finalized contentText when both text and structured content exist', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 5,
          dayIndex: 5,
          type: 'documentation',
          recordedSubmission: {
            submissionId: 102,
            submittedAt: '2026-03-07T12:00:00.000Z',
            contentText: 'Finalized text body',
            contentJson: {
              reflectionMarkdown: 'Final reflection body',
            },
          },
        }}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: true,
          disabledReason: 'Day closed.',
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Finalized text body/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Final reflection body/i)).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('keeps draft restore/autosave active when recordedSubmission exists but task is not read-only', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1,
      contentText: 'Recovered editable draft',
      contentJson: null,
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });

    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          recordedSubmission: {
            submissionId: 77,
            submittedAt: '2026-03-07T08:00:00.000Z',
          },
        }}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Recovered editable draft'),
      ).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Keep editing' } });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });

  it('remounts task-local state across task switches so text/status do not leak and new drafts hydrate correctly', async () => {
    const pendingSave = new Promise<{ taskId: number; updatedAt: string }>(
      () => {},
    );
    putCandidateTaskDraftMock.mockReturnValue(pendingSave);
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

    await waitFor(() => {
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        candidateSessionId: 22,
        taskId: 1,
      });
    });

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

    await waitFor(() => {
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        candidateSessionId: 22,
        taskId: 2,
      });
    });

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

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Recovered task 3 draft'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Draft restored/i)).toBeInTheDocument();
  });
});
