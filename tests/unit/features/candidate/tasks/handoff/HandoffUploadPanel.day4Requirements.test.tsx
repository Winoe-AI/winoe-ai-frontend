import {
  completeHandoffUploadMock,
  fireEvent,
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  screen,
  setMockVideoDuration,
  uploadFileToSignedUrlMock,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { makeStatus, selectVideo } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - Day 4 requirements', () => {
  it('renders Handoff + Demo copy without presentation wording', async () => {
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalled());

    expect(screen.getByText(/Handoff \+ Demo video/i)).toBeInTheDocument();
    expect(
      screen.getByText(/latest valid Handoff \+ Demo/i),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/presentation/i);
  });

  it('blocks upload when the selected demo video is over 15 minutes', async () => {
    setMockVideoDuration(16 * 60);
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalled());

    selectVideo(container, 'too-long.mp4');

    await waitFor(() => {
      expect(
        screen.getByText(/Demo video must be 15 minutes or shorter/i),
      ).toBeInTheDocument();
    });
    expect(initHandoffUploadMock).not.toHaveBeenCalled();
  });

  it('shows preview and enables finalization after valid video upload', async () => {
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalled());

    selectVideo(container, 'valid-demo.mp4');

    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Finalize Handoff \+ Demo/i }),
    ).toBeDisabled();
    expect(screen.getByText(/valid-demo\.mp4/i)).toBeInTheDocument();
  });

  it('persists optional supplemental materials during finalization', async () => {
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalled());

    expect(
      screen.getByText(/No supplemental materials selected/i),
    ).toBeInTheDocument();
    const inputs = container.querySelectorAll('input[type="file"]');
    const supplementalInput = inputs[1] as HTMLInputElement;
    const file = new File(['notes'], 'architecture-notes.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(supplementalInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/architecture-notes\.pdf/i)).toBeInTheDocument();
    });

    selectVideo(container, 'valid-demo.mp4');
    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText(/I consent to submission and processing/i),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Finalize Handoff \+ Demo/i }),
    );

    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    expect(uploadFileToSignedUrlMock).toHaveBeenCalledTimes(2);
    expect(initHandoffUploadMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        assetType: 'supplemental',
        filename: 'architecture-notes.pdf',
        contentType: 'application/pdf',
      }),
    );
  });

  it('shows transcript failed warning and existing materials from status', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_failed',
        recordingStatus: 'uploaded',
        transcriptStatus: 'failed',
        supplementalMaterials: [
          {
            id: 'mat_1',
            filename: 'system-diagram.png',
            downloadUrl: 'https://cdn.example.com/system-diagram.png',
            contentType: 'image/png',
            sizeBytes: 2048,
            uploadedAt: '2026-04-27T13:00:00.000Z',
          },
        ],
      }),
    );
    renderPanel(openGate);

    await waitFor(() => {
      expect(
        screen.getByText(/Transcript status: failed/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/system-diagram\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/may block Day 4 completion/i)).toBeInTheDocument();
  });
});
