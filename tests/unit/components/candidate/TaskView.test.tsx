import { fireEvent, render, screen } from '@testing-library/react';
import TaskView from '@/features/candidate/session/task/CandidateTaskView';
import { textTask } from './TaskView.fixtures';

const getCandidateTaskDraftMock = jest.fn();
const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/api', () => ({
  ...jest.requireActual('@/features/candidate/api'),
  getCandidateTaskDraft: (...args: unknown[]) => getCandidateTaskDraftMock(...args),
  putCandidateTaskDraft: (...args: unknown[]) => putCandidateTaskDraftMock(...args),
}));

describe('TaskView UI states', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getCandidateTaskDraftMock.mockResolvedValue(null);
    putCandidateTaskDraftMock.mockResolvedValue({ taskId: 5, updatedAt: '2026-03-07T10:00:00.000Z' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('disables submission when parent reports submitting', () => {
    const onSubmit = jest.fn();
    render(<TaskView candidateSessionId={99} task={textTask} submitting={true} onSubmit={onSubmit} />);

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
          disabledReason: 'Day closed. This panel is read-only outside the scheduled window.',
          comeBackAt: null,
        }}
      />,
    );

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getAllByText(/panel is read-only outside the scheduled window/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit & continue/i })).toBeDisabled();
  });
});
