import {
  act,
  completeHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
} from './HandoffUploadPanel.testlib';
import {
  createDeferred,
  makeStatus,
  selectVideo,
} from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - replace upload ignores stale status', () => {
  it('uses the latest upload when replacing before finalize and ignores stale status from the old upload', async () => {
    (URL.createObjectURL as jest.Mock)
      .mockReturnValueOnce('blob://preview-a')
      .mockReturnValueOnce('blob://preview-b');
    initHandoffUploadMock
      .mockResolvedValueOnce({
        recordingId: 'rec_a',
        uploadUrl: 'https://storage.example.com/a',
        expiresInSeconds: 900,
      })
      .mockResolvedValueOnce({
        recordingId: 'rec_b',
        uploadUrl: 'https://storage.example.com/b',
        expiresInSeconds: 900,
      });
    completeHandoffUploadMock.mockResolvedValueOnce({
      recordingId: 'rec_b',
      status: 'uploaded',
    });

    const staleStatus = createDeferred<ReturnType<typeof makeStatus>>();
    let statusCallCount = 0;
    getHandoffStatusMock.mockImplementation(() => {
      statusCallCount += 1;
      if (statusCallCount === 1) return Promise.resolve(makeStatus());
      if (statusCallCount === 2) return staleStatus.promise;
      if (statusCallCount === 3)
        return Promise.resolve(
          makeStatus({ recordingId: 'rec_b', recordingStatus: 'uploaded' }),
        );
      return Promise.resolve(makeStatus());
    });

    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'a.mp4');
    await waitFor(() =>
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-a',
      ),
    );
    selectVideo(container, 'b.mp4');
    await waitFor(() => expect(initHandoffUploadMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-b',
      ),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-a');
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(3));
    await act(async () => {
      staleStatus.resolve(
        makeStatus({ recordingId: 'rec_a', recordingStatus: 'uploaded' }),
      );
      await Promise.resolve();
    });
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'blob://preview-b',
    );
    fireEvent.click(
      screen.getByLabelText(
        /I understand and consent to submission and processing/i,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));
    await waitFor(() =>
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1),
    );
    expect(completeHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({ recordingId: 'rec_b' }),
    );
  });
});
