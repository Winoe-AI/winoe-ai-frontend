import {
  closedGate,
  fireEvent,
  getHandoffStatusMock,
  initHandoffUploadMock,
  openGate,
  renderPanel,
  screen,
  waitFor,
} from './HandoffUploadPanel.testlib';
import { getFileInput, makeStatus } from './HandoffUploadPanel.helpers';

describe('HandoffUploadPanel - policy gates and file-size handling', () => {
  it('disables delete with backend policy reason', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        canDelete: false,
        deleteDisabledReason: 'Day 4 is closed for deletion.',
      }),
    );
    renderPanel(openGate);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^delete upload$/i }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByText(/Day 4 is closed for deletion\./i),
    ).toBeInTheDocument();
  });

  it('disables replace when task window is closed', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({ recordingId: 'rec_uploaded', recordingStatus: 'uploaded' }),
    );
    renderPanel(closedGate);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/day closed\./i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeDisabled();
  });

  it('does not enforce a hard client-side upload-size cap', async () => {
    const oversizedFile = {
      name: 'oversized.mp4',
      type: 'video/mp4',
      size: 350 * 1024 * 1024,
    } as File;
    const { container } = renderPanel(openGate);
    await waitFor(() => expect(getHandoffStatusMock).toHaveBeenCalledTimes(1));
    fireEvent.change(getFileInput(container), {
      target: { files: [oversizedFile] },
    });
    await waitFor(() => expect(initHandoffUploadMock).toHaveBeenCalledTimes(1));
    expect(initHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({ sizeBytes: oversizedFile.size }),
    );
    expect(screen.queryByText(/file exceeds/i)).not.toBeInTheDocument();
  });
});
