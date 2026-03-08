import { act, fireEvent, render, screen } from '@testing-library/react';
import TaskView from '@/features/candidate/session/task/CandidateTaskView';

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

const textTask = {
  id: 5,
  dayIndex: 1,
  type: 'design',
  title: 'Product brief',
  description: 'Describe your plan.',
};

const githubNativeTask = {
  id: 11,
  dayIndex: 2,
  type: 'code',
  title: 'Implement feature',
  description: 'Write the code in GitHub.',
};

describe('TaskView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getCandidateTaskDraftMock.mockResolvedValue(null);
    putCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      updatedAt: '2026-03-07T10:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows validation error for empty text submissions', async () => {
    const onSubmit = jest.fn();

    render(
      <TaskView
        candidateSessionId={99}
        task={textTask}
        submitting={false}
        onSubmit={onSubmit}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /submit & continue/i }),
      );
    });

    expect(
      await screen.findByText(/please enter an answer before submitting/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed text payload for text tasks', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 1,
      taskId: 5,
      candidateSessionId: 99,
      submittedAt: '2026-03-07T12:00:00.000Z',
      progress: { completed: 1, total: 5 },
      isComplete: false,
    });

    render(
      <TaskView
        candidateSessionId={99}
        task={textTask}
        submitting={false}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  Needs trim  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(onSubmit).toHaveBeenCalledWith({ contentText: 'Needs trim' });
  });

  it('renders GitHub-native instructions and submits empty payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ ok: true });

    render(
      <TaskView
        candidateSessionId={99}
        task={githubNativeTask}
        submitting={false}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText(/Work in your GitHub repository or Codespace/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('disables submission when parent reports submitting', () => {
    const onSubmit = jest.fn();
    render(
      <TaskView
        candidateSessionId={99}
        task={textTask}
        submitting={true}
        onSubmit={onSubmit}
      />,
    );

    const submittingBtn = screen.getByRole('button', { name: /submitting/i });
    expect(submittingBtn).toBeDisabled();
    fireEvent.click(submittingBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('locks the text task surface in read-only mode', () => {
    render(
      <TaskView
        candidateSessionId={99}
        task={textTask}
        submitting={false}
        onSubmit={jest.fn()}
        actionGate={{
          isReadOnly: true,
          disabledReason:
            'Day closed. This panel is read-only outside the scheduled window.',
          comeBackAt: null,
        }}
      />,
    );

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.getAllByText(/panel is read-only outside the scheduled window/i)
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /submit & continue/i }),
    ).toBeDisabled();
  });
});
