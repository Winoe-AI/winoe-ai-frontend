import { act, fireEvent, render, screen } from '@testing-library/react';
import TaskView from '@/features/candidate/tasks/CandidateTaskView';
import { githubNativeTask, textTask } from './TaskView.fixtures';

const getCandidateTaskDraftMock = jest.fn();
const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  ...jest.requireActual('@/features/candidate/session/api'),
  getCandidateTaskDraft: (...args: unknown[]) =>
    getCandidateTaskDraftMock(...args),
  putCandidateTaskDraft: (...args: unknown[]) =>
    putCandidateTaskDraftMock(...args),
}));

describe('TaskView submission', () => {
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
    await act(async () => Promise.resolve());
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
    await act(async () => Promise.resolve());
    expect(onSubmit).toHaveBeenCalledWith({});
  });
});
