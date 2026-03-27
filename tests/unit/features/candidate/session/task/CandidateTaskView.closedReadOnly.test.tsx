import { fireEvent, screen, waitFor } from '@testing-library/react';
import { baseTask, getCandidateTaskDraftMock, primeDraftMocks, renderTaskView } from './CandidateTaskView.testlib';

describe('CandidateTaskView closed/read-only states', () => {
  beforeEach(() => {
    primeDraftMocks();
  });

  it('uses recorded submission content without draft calls in read-only mode', async () => {
    renderTaskView({
      task: { ...baseTask, recordedSubmission: { submissionId: 99, submittedAt: '2026-03-07T12:00:00.000Z', contentText: 'Finalized submission body' } },
      actionGate: { isReadOnly: true, disabledReason: 'Day closed.', comeBackAt: null },
    });
    await waitFor(() => expect(screen.getByText(/Finalized submission body/i)).toBeInTheDocument());
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('shows placeholder when no finalized reflection content exists', async () => {
    renderTaskView({
      task: { ...baseTask, id: 5, dayIndex: 5, type: 'documentation', title: 'Reflection', description: 'Submit your structured reflection.' },
      actionGate: { isReadOnly: true, disabledReason: 'Day closed.', comeBackAt: null },
    });
    await waitFor(() => expect(screen.getByText(/day closed/i)).toBeInTheDocument());
    expect(screen.getByText(/no finalized reflection content is available/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /submit & continue/i })).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('treats cutoff commit as closed for day2/day3 submit actions', () => {
    const onSubmit = jest.fn();
    renderTaskView({
      task: { ...baseTask, id: 2, dayIndex: 2, type: 'code', cutoffCommitSha: 'abc123def456' },
      actionGate: { isReadOnly: false, disabledReason: null, comeBackAt: null },
      onSubmit,
    });
    expect(screen.getAllByText(/Day closed\. Work after cutoff will not be considered\./i).length).toBeGreaterThan(0);
    const submitButton = screen.getByRole('button', { name: /Submit & Continue/i });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
