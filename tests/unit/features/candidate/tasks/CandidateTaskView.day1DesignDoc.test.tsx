import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  baseTask,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  putCandidateTaskDraftMock,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView Day 1 design document workspace', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    primeDraftMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const settleInitialRestore = async () => {
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });
  };

  it('shows the Project Brief, from-scratch prompts, split editor, and live preview', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        description:
          '# Build a customer intake tool\n\nSupport Winoe AI Trial evaluation.',
        cutoffAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });

    await waitFor(() =>
      expect(screen.getAllByText(/Project Brief/i).length).toBeGreaterThan(0),
    );
    expect(
      screen.getByText(/Plan the build from scratch/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/What tech stack will you use and why\?/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/How will you structure the project\?/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/What is your testing strategy\?/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Markdown editor/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Live preview/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/repository exploration/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp('existing code' + 'base', 'i')),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Build a customer intake tool/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '# Candidate plan\n\nUse React.' },
    });
    expect(
      screen.getByRole('heading', { name: /Candidate plan/i }),
    ).toBeInTheDocument();
  });

  it('shows an unavailable state when the Project Brief is missing', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        description: ' ',
      },
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Project Brief is unavailable/i),
      ).toBeInTheDocument(),
    );
  });

  it('requires confirmation before Day 1 submission and supports cancel', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 1,
      taskId: 1,
      candidateSessionId: 22,
      submittedAt: '2026-03-07T12:00:00.000Z',
      progress: { completed: 1, total: 5 },
      isComplete: false,
    });
    renderTaskView({ onSubmit });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Final Day 1 design document' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', {
      name: /submit day 1 design document/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Latest Day 1 design document' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit and lock/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        contentText: 'Latest Day 1 design document',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(
      screen.getByText(/Day 1 design document locked/i),
    ).toBeInTheDocument();
  });

  it('does not open the Day 1 confirmation when submit is disabled', async () => {
    renderTaskView({
      actionGate: {
        isReadOnly: true,
        disabledReason: 'Day 1 closed.',
        comeBackAt: '2026-03-08T09:00:00.000Z',
      },
    });

    const submitButton = await screen.findByRole('button', {
      name: /submit & continue/i,
    });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads Day 1 after cutoff with finalized content as immutable without draft restore', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        cutoffAt: new Date(Date.now() - 1000).toISOString(),
        recordedSubmission: {
          submissionId: 42,
          submittedAt: '2026-03-07T17:01:00.000Z',
          contentText: 'Final submitted architecture plan',
        },
      },
    });

    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(
      screen.getByText(/Day 1 design document locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Final submitted architecture plan/i),
    ).toBeInTheDocument();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('loads Day 1 after cutoff with saved draft content as immutable without autosave', async () => {
    getCandidateTaskDraftMock.mockResolvedValueOnce({
      taskId: 1,
      candidateSessionId: 22,
      contentText: 'Saved draft architecture plan',
      contentJson: null,
      updatedAt: '2026-03-07T16:55:00.000Z',
    });

    renderTaskView({
      task: {
        ...baseTask,
        cutoffAt: new Date(Date.now() - 1000).toISOString(),
      },
    });

    await waitFor(() =>
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        taskId: 1,
        candidateSessionId: 22,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(
      screen.getByText(/Day 1 design document locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Day 1 closed at the 5 PM deadline/i).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/Saved draft architecture plan/i),
    ).toBeInTheDocument();
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('loads Day 1 after cutoff with no saved content as an empty immutable artifact', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        cutoffAt: new Date(Date.now() - 1000).toISOString(),
      },
    });

    await waitFor(() =>
      expect(getCandidateTaskDraftMock).toHaveBeenCalledWith({
        taskId: 1,
        candidateSessionId: 22,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(
      screen.getByText(/Day 1 design document locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No saved Day 1 design document is available/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /^Day 1 Design Document$/ }),
    ).not.toBeInTheDocument();
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('autosaves and locks Day 1 when the deadline arrives', async () => {
    const cutoffAt = new Date(Date.now() + 2000).toISOString();
    renderTaskView({
      task: {
        ...baseTask,
        cutoffAt,
      },
    });
    await settleInitialRestore();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Draft at deadline' },
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(putCandidateTaskDraftMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(screen.getByText(/Draft at deadline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Day 1 design document locked/i),
    ).toBeInTheDocument();
  });

  it('shows Save failed when the deadline autosave fails before locking', async () => {
    putCandidateTaskDraftMock.mockRejectedValueOnce(new Error('network down'));
    const cutoffAt = new Date(Date.now() + 2000).toISOString();
    renderTaskView({
      task: {
        ...baseTask,
        cutoffAt,
      },
    });
    await settleInitialRestore();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Draft that failed deadline save' },
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(putCandidateTaskDraftMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(screen.getAllByText(/Save failed/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Saved at/i)).not.toBeInTheDocument();
  });

  it('shows starter content only for editable Day 1 with no restored draft', async () => {
    renderTaskView();

    await settleInitialRestore();

    expect(
      screen.getByRole('heading', { name: /^Day 1 Design Document$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole<HTMLTextAreaElement>('textbox').value).toContain(
      'What tech stack will you use and why?',
    );
  });

  it('does not autosave starter content before server draft restore settles', async () => {
    let resolveDraft:
      | ((value: {
          taskId: number;
          candidateSessionId: number;
          contentText: string;
          contentJson: null;
          updatedAt: string;
        }) => void)
      | undefined;
    getCandidateTaskDraftMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDraft = resolve;
      }),
    );

    renderTaskView();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();

    await act(async () => {
      resolveDraft?.({
        taskId: 1,
        candidateSessionId: 22,
        contentText: 'Restored server draft',
        contentJson: null,
        updatedAt: '2026-03-07T10:00:00.000Z',
      });
    });

    expect(
      await screen.findByDisplayValue(/Restored server draft/i),
    ).toBeInTheDocument();
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('does not autosave starter content after an empty restore settles', async () => {
    renderTaskView();

    await settleInitialRestore();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole<HTMLTextAreaElement>('textbox').value).toContain(
      'What tech stack will you use and why?',
    );
    expect(putCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('renders exact autosave status copy while saving and after save', async () => {
    let resolveSave:
      | ((value: { taskId: number; updatedAt: string }) => void)
      | undefined;
    putCandidateTaskDraftMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    renderTaskView();
    await settleInitialRestore();
    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: 'Autosave status text' },
    });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Saving\.\.\./i)).toBeInTheDocument();

    await act(async () => {
      resolveSave?.({
        taskId: 1,
        updatedAt: '2026-03-07T10:00:00.000Z',
      });
    });

    expect((await screen.findAllByText(/Saved/i)).length).toBeGreaterThan(0);
  });
});
