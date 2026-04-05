import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  baseTask,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  putCandidateTaskDraftMock,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView reflection validation and editable draft behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    primeDraftMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses generic markdown validation for day 5 reflection submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Reflection',
        description: 'Submit your structured reflection.',
      },
      onSubmit,
    });

    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/please enter an answer before submitting\./i),
      ).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value:
          '# Reflection\n\nHandled ambiguous requirements by validating assumptions early in the flow.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        contentText:
          '# Reflection\n\nHandled ambiguous requirements by validating assumptions early in the flow.',
      }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps draft restore/autosave active when recordedSubmission exists but task is editable', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1,
      contentText: 'Recovered editable draft',
      contentJson: null,
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    renderTaskView({
      task: {
        ...baseTask,
        recordedSubmission: {
          submissionId: 77,
          submittedAt: '2026-03-07T08:00:00.000Z',
        },
      },
      actionGate: { isReadOnly: false, disabledReason: null, comeBackAt: null },
    });
    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Recovered editable draft'),
      ).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Keep editing' },
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });
});
