import {
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { selectVideo } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - object URL cleanup', () => {
  it('revokes object URLs on replace and unmount', async () => {
    (URL.createObjectURL as jest.Mock)
      .mockReturnValueOnce('blob://preview-1')
      .mockReturnValueOnce('blob://preview-2');
    initHandoffUploadMock
      .mockResolvedValueOnce({
        recordingId: 'rec_1',
        uploadUrl: 'https://storage.example.com/signed1',
        expiresInSeconds: 900,
      })
      .mockResolvedValueOnce({
        recordingId: 'rec_2',
        uploadUrl: 'https://storage.example.com/signed2',
        expiresInSeconds: 900,
      });
    const { container, unmount } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'first.mp4');
    await waitFor(() =>
      expect(container.querySelector('video')).toBeInTheDocument(),
    );
    selectVideo(container, 'second.mp4');
    await waitFor(() => expect(initHandoffUploadMock).toHaveBeenCalledTimes(2));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-1');
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-2');
  });
});
