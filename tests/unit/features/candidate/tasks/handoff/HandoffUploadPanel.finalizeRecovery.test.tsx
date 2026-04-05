import {
  completeHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { makeStatus, selectVideo } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - finalize recovery', () => {
  it('keeps staged local preview and finalize step through status refresh before complete', async () => {
    (URL.createObjectURL as jest.Mock).mockReturnValueOnce(
      'blob://staged-preview',
    );
    getHandoffStatusMock
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus());
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'staged.mp4');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /finalize demo/i }),
      ).toBeDisabled(),
    );
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'blob://staged-preview',
    );
    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /refresh transcript/i }),
    );
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(3));
    expect(
      screen.getByRole('button', { name: /finalize demo/i }),
    ).toBeDisabled();
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'blob://staged-preview',
    );
    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();
  });

  it('recovers from finalize failure and allows finalize retry on the same staged upload', async () => {
    completeHandoffUploadMock
      .mockRejectedValueOnce(new Error('Finalize failed once'))
      .mockResolvedValueOnce({ recordingId: 'rec_123', status: 'uploaded' });
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    selectVideo(container, 'handoff.mp4');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /finalize demo/i }),
      ).toBeDisabled(),
    );
    fireEvent.click(
      screen.getByLabelText(/I consent to submission and processing/i),
    );
    fireEvent.click(screen.getByRole('button', { name: /finalize demo/i }));
    await waitFor(() =>
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(screen.getByText(/Finalize failed once/i)).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /finalize demo/i }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /finalize demo/i }));
    await waitFor(() =>
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(2),
    );
    expect(completeHandoffUploadMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ recordingId: 'rec_123' }),
    );
    expect(completeHandoffUploadMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ recordingId: 'rec_123' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /finalize demo/i }),
      ).not.toBeInTheDocument(),
    );
    expect(container.querySelector('video')).toBeInTheDocument();
  });
});
