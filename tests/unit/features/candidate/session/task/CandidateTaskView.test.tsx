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

  function fillAllReflectionSections() {
    fireEvent.change(screen.getByLabelText(/challenges/i), {
      target: {
        value:
          'Handled ambiguous requirements by validating assumptions early in the flow.',
      },
    });
    fireEvent.change(screen.getByLabelText(/^decisions$/i), {
      target: {
        value:
          'Chose deterministic contracts so UI and backend validation align.',
      },
    });
    fireEvent.change(screen.getByLabelText(/tradeoffs/i), {
      target: {
        value:
          'Accepted stricter rules to improve evaluation consistency across candidates.',
      },
    });
    fireEvent.change(screen.getByLabelText(/communication/i), {
      target: {
        value:
          'Documented risks and handoff notes clearly at each implementation milestone.',
      },
    });
    fireEvent.change(screen.getByLabelText(/what you would do next/i), {
      target: {
        value:
          'Next I would add rubric-linked evidence references and quality checks.',
      },
    });
  }

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

  it('routes day 5 docs to structured reflection panel and restores section draft', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      contentText: null,
      contentJson: {
        reflection: {
          challenges: 'Recovered challenge notes',
          decisions: 'Recovered decision notes',
          tradeoffs: 'Recovered tradeoff notes',
          communication: 'Recovered communication notes',
          next: 'Recovered next steps notes',
        },
      },
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
        screen.getByDisplayValue('Recovered challenge notes'),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /preview/i }),
    ).toBeInTheDocument();
    const restored = screen.getByText(/Draft restored/i);
    expect(restored.closest('div')?.className).toContain('sticky');
    expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
  });

  it('keeps non-day5 documentation tasks on the generic text panel', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 11,
          dayIndex: 1,
          type: 'documentation',
          title: 'Documentation',
        }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByLabelText(/challenges/i)).toBeNull();
  });

  it('keeps non-day5 reflection-like documentation tasks on the generic text panel', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 12,
          dayIndex: 4,
          type: 'documentation',
          title: 'Reflection',
          description: 'Document your approach.',
          recordedSubmission: {
            submissionId: 1202,
            submittedAt: '2026-03-07T12:00:00.000Z',
            contentText: 'Canonical markdown text',
            contentJson: {
              kind: 'day5_reflection',
              sections: {
                challenges: 'Should not trigger day 5 panel on day 4',
              },
            },
          },
        }}
        submitting={false}
        submitError={null}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByLabelText(/challenges/i)).toBeNull();
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

  it('in closed mode with backend current_task shape (no recorded submission) renders read-only placeholder', async () => {
    render(
      <CandidateTaskView
        candidateSessionId={22}
        task={{
          ...baseTask,
          id: 5,
          dayIndex: 5,
          type: 'documentation',
          title: 'Reflection',
          description: 'Submit your structured reflection.',
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
      expect(screen.getByText(/day closed/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/no finalized reflection content is available/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /submit & continue/i }),
    ).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('in closed mode renders structured finalized reflection sections', async () => {
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
              kind: 'day5_reflection',
              sections: {
                challenges: 'Final challenges',
                decisions: 'Final decisions',
                tradeoffs: 'Final tradeoffs',
                communication: 'Final communication',
                next: 'Final next',
              },
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
      expect(screen.getByText(/Final challenges/i)).toBeInTheDocument();
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
              kind: 'day5_reflection',
              sections: {
                challenges: 'Structured challenges body',
                decisions: 'Structured decisions body',
                tradeoffs: 'Structured tradeoffs body',
                communication: 'Structured communication body',
                next: 'Structured next body',
              },
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
    expect(screen.queryByText(/Structured challenges body/i)).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('maps backend 422 reflection.communication error to inline field via submit interaction', async () => {
    const onSubmit = jest.fn().mockRejectedValue({
      status: 422,
      details: {
        errorCode: 'VALIDATION_ERROR',
        details: {
          fields: {
            'reflection.communication': ['too_short'],
          },
        },
      },
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
          description: 'Submit your structured reflection.',
        }}
        submitting={false}
        submitError={null}
        onSubmit={onSubmit}
      />,
    );

    fillAllReflectionSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    await waitFor(() => {
      const communicationField = screen.getByLabelText(/communication/i);
      const communicationSection = communicationField.closest('section');
      expect(communicationSection).not.toBeNull();
      expect(
        ((communicationSection as HTMLElement).textContent ?? '').toLowerCase(),
      ).toContain('add at least 20 characters');
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
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
