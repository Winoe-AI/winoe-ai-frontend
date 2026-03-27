import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  getCandidateTaskDraftMock,
  primeDraftMocks,
  putCandidateTaskDraftMock,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView draft restore and autosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    primeDraftMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('restores Day 1 draft and shows restored messaging', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 1, contentText: 'Recovered day 1 draft', contentJson: null, updatedAt: '2026-03-07T09:00:00.000Z', finalizedAt: null, finalizedSubmissionId: null,
    });
    renderTaskView();
    await waitFor(() => expect(screen.getByDisplayValue('Recovered day 1 draft')).toBeInTheDocument());
    expect(screen.getByText(/Draft restored/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
  });

  it('shows autosave status transition from saving to saved', async () => {
    let resolvePut: ((value: { taskId: number; updatedAt: string }) => void) | null = null;
    putCandidateTaskDraftMock.mockReturnValue(new Promise<{ taskId: number; updatedAt: string }>((resolve) => { resolvePut = resolve; }));
    renderTaskView();
    await waitFor(() => expect(getCandidateTaskDraftMock).toHaveBeenCalled());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typing day 1...' } });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolvePut?.({ taskId: 1, updatedAt: '2026-03-07T10:30:00.000Z' });
    });
    await waitFor(() => expect(screen.getByText(/Saved at/i)).toBeInTheDocument());
  });
});
