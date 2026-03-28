import {
  completeHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  screen,
  uploadFileToSignedUrlMock,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { selectVideo } from './HandoffUploadPanel.helpers';

async function acceptConsentAndComplete() {
  fireEvent.click(
    screen.getByLabelText(
      /I understand and consent to submission and processing/i,
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));
  await waitFor(() => {
    expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
  });
}

describe('HandoffUploadPanel - upload retries', () => {
  it('requires consent before complete upload can run', async () => {
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByText(/Check the consent box to enable completion/i),
    ).toBeInTheDocument();
    await acceptConsentAndComplete();
    expect(completeHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recordingId: 'rec_123',
        consent: expect.objectContaining({
          consented: true,
          aiNoticeVersion: 'mvp1',
        }),
      }),
    );
  });

  it('allows retry after upload init failure without leaking uploaded state', async () => {
    initHandoffUploadMock
      .mockRejectedValueOnce(new Error('Init unavailable'))
      .mockResolvedValueOnce({
        recordingId: 'rec_retry',
        uploadUrl: 'https://storage.example.com/retry',
        expiresInSeconds: 900,
      });
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'first.mp4');
    await waitFor(() =>
      expect(screen.getByText(/Init unavailable/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /replace upload/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /complete upload/i }),
    ).not.toBeInTheDocument();
    selectVideo(container, 'second.mp4');
    await waitFor(() => expect(initHandoffUploadMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled(),
    );
    expect(uploadFileToSignedUrlMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('status', { name: /transcript processing/i }),
    ).not.toBeInTheDocument();
  });

  it('allows retry after signed URL upload failure without leaking complete state', async () => {
    initHandoffUploadMock
      .mockResolvedValueOnce({
        recordingId: 'rec_fail_put',
        uploadUrl: 'https://storage.example.com/fail',
        expiresInSeconds: 900,
      })
      .mockResolvedValueOnce({
        recordingId: 'rec_after_put_retry',
        uploadUrl: 'https://storage.example.com/retry',
        expiresInSeconds: 900,
      });
    uploadFileToSignedUrlMock
      .mockRejectedValueOnce(new Error('Signed URL upload failed'))
      .mockResolvedValueOnce(undefined);
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'first.mp4');
    await waitFor(() =>
      expect(screen.getByText(/Signed URL upload failed/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /complete upload/i }),
    ).not.toBeInTheDocument();
    expect(completeHandoffUploadMock).not.toHaveBeenCalled();
    selectVideo(container, 'second.mp4');
    await waitFor(() =>
      expect(uploadFileToSignedUrlMock).toHaveBeenCalledTimes(2),
    );
    expect(
      screen.getByRole('button', { name: /complete upload/i }),
    ).toBeDisabled();
    expect(completeHandoffUploadMock).not.toHaveBeenCalled();
  });
});
