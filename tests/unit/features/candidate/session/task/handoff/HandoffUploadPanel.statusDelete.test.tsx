import {
  act,
  baseTask,
  deleteHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
  within,
} from './HandoffUploadPanel.testlib';
import { makeStatus } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - status hydration and delete flow', () => {
  it('hydrates processing status on mount and polls until ready', async () => {
    getHandoffStatusMock
      .mockResolvedValueOnce(makeStatus({ recordingId: 'rec_123', recordingStatus: 'uploaded', transcriptStatus: 'processing', transcriptProgressPct: 60 }))
      .mockResolvedValueOnce(makeStatus({ recordingId: 'rec_123', recordingStatus: 'ready', transcriptStatus: 'ready', transcriptText: 'Final transcript body', transcriptSegments: [{ id: null, startMs: 5000, endMs: 8000, text: 'Intro segment' }] }));

    renderPanel(openGate);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/transcript processing\.\.\./i));
    expect(screen.getByText(/\(60%\)/i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/final transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/00:05 - 00:08/i)).toBeInTheDocument();
    expect(screen.getByText(/intro segment/i)).toBeInTheDocument();
  });

  it('opens delete confirmation and clears UI after delete succeeds', async () => {
    getHandoffStatusMock
      .mockResolvedValueOnce(makeStatus({ recordingId: 'rec_uploaded', recordingStatus: 'uploaded', recordingDownloadUrl: 'https://cdn.example.com/rec_uploaded.mp4', transcriptStatus: 'ready', transcriptText: 'Ready transcript body' }))
      .mockResolvedValueOnce(makeStatus({ recordingId: null, recordingStatus: 'deleted', isDeleted: true, deletedAt: '2026-03-16T10:05:00.000Z', transcriptStatus: 'deleted' }));

    renderPanel(openGate);
    await waitFor(() => expect(screen.getByRole('button', { name: /^delete upload$/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^delete upload$/i }));
    expect(screen.getByText(/Delete this upload\?/i)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: /delete upload confirmation/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /Delete upload/i }));

    await waitFor(() => expect(deleteHandoffUploadMock).toHaveBeenCalledTimes(1));
    expect(deleteHandoffUploadMock).toHaveBeenCalledWith(expect.objectContaining({ taskId: baseTask.id, candidateSessionId: 77, recordingId: 'rec_uploaded' }));
    await waitFor(() => expect(screen.getByText(/Upload deleted\./i)).toBeInTheDocument());
    expect(screen.queryByText(/Ready transcript body/i)).not.toBeInTheDocument();
  });
});
