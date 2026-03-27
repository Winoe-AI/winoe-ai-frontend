import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  baseTask,
  fillAllReflectionSections,
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

  it('maps backend reflection.communication validation to inline field error', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ status: 422, details: { errorCode: 'VALIDATION_ERROR', details: { fields: { 'reflection.communication': ['too_short'] } } } });
    renderTaskView({
      task: { ...baseTask, id: 5, dayIndex: 5, type: 'documentation', title: 'Reflection', description: 'Submit your structured reflection.' },
      onSubmit,
    });
    fillAllReflectionSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await waitFor(() => {
      const section = screen.getByLabelText(/communication/i).closest('section');
      expect((section?.textContent ?? '').toLowerCase()).toContain('add at least 20 characters');
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps draft restore/autosave active when recordedSubmission exists but task is editable', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1, contentText: 'Recovered editable draft', contentJson: null, updatedAt: '2026-03-07T09:00:00.000Z', finalizedAt: null, finalizedSubmissionId: null,
    });
    renderTaskView({
      task: { ...baseTask, recordedSubmission: { submissionId: 77, submittedAt: '2026-03-07T08:00:00.000Z' } },
      actionGate: { isReadOnly: false, disabledReason: null, comeBackAt: null },
    });
    await waitFor(() => expect(screen.getByDisplayValue('Recovered editable draft')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep editing' } });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });
});
