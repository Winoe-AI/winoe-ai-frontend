import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderTaskView } from './CandidateTaskView.testlib';

describe('CandidateTaskView submit feedback statuses', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows checkpoint feedback with checkpoint sha for day2 code submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 201,
      taskId: 2,
      candidateSessionId: 22,
      submittedAt: '2026-03-08T14:00:00.000Z',
      progress: { completed: 2, total: 5 },
      isComplete: false,
      commitSha: 'abc123def456',
      checkpointSha: 'abc123def456',
      finalSha: null,
    });
    renderTaskView({
      task: {
        id: 2,
        dayIndex: 2,
        type: 'code',
        title: 'Code',
        description: 'Work in GitHub',
      },
      onSubmit,
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await waitFor(() =>
      expect(screen.getByText(/Checkpoint recorded/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Checkpoint SHA:/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123d/i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.getByText(/Checkpoint recorded/i)).toBeInTheDocument();
  });

  it('shows final feedback with commit fallback for day3 debug submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 301,
      taskId: 3,
      candidateSessionId: 22,
      submittedAt: '2026-03-08T14:10:00.000Z',
      progress: { completed: 3, total: 5 },
      isComplete: false,
      commitSha: 'f00b4r777888',
      checkpointSha: null,
      finalSha: null,
    });
    renderTaskView({
      task: {
        id: 3,
        dayIndex: 3,
        type: 'debug',
        title: 'Debug',
        description: 'Fix and submit',
      },
      onSubmit,
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));
    await waitFor(() =>
      expect(screen.getByText(/Final recorded/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Recorded commit:/i)).toBeInTheDocument();
    expect(screen.getByText(/f00b4r7/i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.getByText(/Final recorded/i)).toBeInTheDocument();
  });
});
