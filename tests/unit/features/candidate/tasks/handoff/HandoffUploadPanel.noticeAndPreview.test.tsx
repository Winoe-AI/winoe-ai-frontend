import {
  getHandoffStatusMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { makeStatus } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - notice and persisted preview', () => {
  it('renders AI notice with fallback version metadata', async () => {
    renderPanel(openGate);
    await waitFor(() => {
      expect(
        screen.getByText(/AI-assisted evaluation notice/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Notice mvp1/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /What we evaluate/i }),
    ).toHaveAttribute('href', '/candidate/what-we-evaluate');
  });

  it('shows persisted preview when backend status has download URL', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: 'https://cdn.example.com/rec_uploaded.mp4',
      }),
    );
    const { container } = renderPanel(openGate);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument();
    });
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe(
      'https://cdn.example.com/rec_uploaded.mp4',
    );
  });
});
