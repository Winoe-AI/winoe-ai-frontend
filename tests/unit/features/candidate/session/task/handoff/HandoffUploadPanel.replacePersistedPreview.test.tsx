import {
  completeHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { makeStatus, selectVideo } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - replace upload persisted preview', () => {
  it('replaces local preview with persisted preview after finalize using the latest upload attempt', async () => {
    (URL.createObjectURL as jest.Mock).mockReturnValueOnce('blob://preview-a').mockReturnValueOnce('blob://preview-b');
    initHandoffUploadMock.mockResolvedValueOnce({ recordingId: 'rec_a', uploadUrl: 'https://storage.example.com/a', expiresInSeconds: 900 }).mockResolvedValueOnce({ recordingId: 'rec_b', uploadUrl: 'https://storage.example.com/b', expiresInSeconds: 900 });
    completeHandoffUploadMock.mockResolvedValueOnce({ recordingId: 'rec_b', status: 'uploaded' });
    getHandoffStatusMock
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: 'rec_b',
          recordingStatus: 'uploaded',
          recordingDownloadUrl: 'https://cdn.example.com/rec_b.mp4',
          transcriptStatus: 'ready',
        }),
      );

    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'a.mp4');
    await waitFor(() => expect(container.querySelector('video')?.getAttribute('src')).toBe('blob://preview-a'));
    selectVideo(container, 'b.mp4');
    await waitFor(() => expect(container.querySelector('video')?.getAttribute('src')).toBe('blob://preview-b'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-a');
    fireEvent.click(screen.getByLabelText(/I understand and consent to submission and processing/i));
    fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledWith(expect.objectContaining({ recordingId: 'rec_b' }));
    });
    await waitFor(() => expect(container.querySelector('video')?.getAttribute('src')).toBe('https://cdn.example.com/rec_b.mp4'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-b');
    expect(screen.queryByRole('button', { name: /complete upload/i })).not.toBeInTheDocument();
  });
});
