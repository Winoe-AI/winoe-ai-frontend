import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { HandoffUploadPanel } from '@/features/candidate/session/task/handoff/HandoffUploadPanel';
import type { HandoffStatusResponse } from '@/features/candidate/session/task/handoff/handoffApi';
import type { Task } from '@/features/candidate/session/task/types';

const initHandoffUploadMock = jest.fn();
const uploadFileToSignedUrlMock = jest.fn();
const completeHandoffUploadMock = jest.fn();
const getHandoffStatusMock = jest.fn();

jest.mock('@/features/candidate/session/task/handoff/handoffApi', () => ({
  initHandoffUpload: (...args: unknown[]) => initHandoffUploadMock(...args),
  uploadFileToSignedUrl: (...args: unknown[]) =>
    uploadFileToSignedUrlMock(...args),
  completeHandoffUpload: (...args: unknown[]) =>
    completeHandoffUploadMock(...args),
  getHandoffStatus: (...args: unknown[]) => getHandoffStatusMock(...args),
}));

const baseTask: Task = {
  id: 4,
  dayIndex: 4,
  type: 'handoff',
  title: 'Handoff demo',
  description: 'Upload your walkthrough video.',
};

const openGate = {
  isReadOnly: false,
  disabledReason: null,
  comeBackAt: null,
} as const;

const closedGate = {
  isReadOnly: true,
  disabledReason: 'Day closed.',
  comeBackAt: null,
} as const;

function makeStatus(
  overrides: Partial<HandoffStatusResponse> = {},
): HandoffStatusResponse {
  return {
    recordingId: null,
    recordingStatus: null,
    recordingDownloadUrl: null,
    transcriptStatus: 'not_started',
    transcriptProgressPct: null,
    transcriptText: null,
    transcriptSegments: null,
    ...overrides,
  };
}

const emptyStatus = makeStatus();

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function selectVideo(container: HTMLElement, filename = 'handoff.mp4') {
  fireEvent.change(getFileInput(container), {
    target: {
      files: [new File(['video-data'], filename, { type: 'video/mp4' })],
    },
  });
}

describe('HandoffUploadPanel', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob://handoff-preview');
    URL.revokeObjectURL = jest.fn();

    getHandoffStatusMock.mockResolvedValue(emptyStatus);
    initHandoffUploadMock.mockResolvedValue({
      recordingId: 'rec_123',
      uploadUrl: 'https://storage.example.com/signed',
      expiresInSeconds: 900,
    });
    uploadFileToSignedUrlMock.mockResolvedValue(undefined);
    completeHandoffUploadMock.mockResolvedValue({
      recordingId: 'rec_123',
      status: 'uploaded',
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  });

  it('shows persisted preview when backend status has download URL', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: 'https://cdn.example.com/rec_uploaded.mp4',
      }),
    );

    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeEnabled();
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe(
      'https://cdn.example.com/rec_uploaded.mp4',
    );
  });

  it('shows uploaded state when persisted preview URL is temporarily unavailable', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: null,
      }),
    );

    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/preview is temporarily unavailable right now/i),
    ).toBeInTheDocument();
  });

  it('hydrates processing status on mount and polls until ready', async () => {
    getHandoffStatusMock
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: 'rec_123',
          recordingStatus: 'uploaded',
          transcriptStatus: 'processing',
          transcriptProgressPct: 60,
        }),
      )
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: 'rec_123',
          recordingStatus: 'ready',
          transcriptStatus: 'ready',
          transcriptText: 'Final transcript body',
          transcriptSegments: [
            {
              id: null,
              startMs: 5000,
              endMs: 8000,
              text: 'Intro segment',
            },
          ],
        }),
      );

    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/transcript processing\.\.\./i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/\(60%\)/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText(/final transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/00:05 - 00:08/i)).toBeInTheDocument();
    expect(screen.getByText(/intro segment/i)).toBeInTheDocument();
  });

  it('renders transcript text and timestamped segments when mount status is ready', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_ready',
        recordingStatus: 'ready',
        transcriptStatus: 'ready',
        transcriptText: 'Ready transcript body',
        transcriptSegments: [
          {
            id: null,
            startMs: 1000,
            endMs: 3400,
            text: 'Ready segment line',
          },
        ],
      }),
    );

    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/ready transcript body/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/00:01 - 00:03/i)).toBeInTheDocument();
    expect(screen.getByText(/ready segment line/i)).toBeInTheDocument();
  });

  it('shows fallback when transcript is ready but text and segments are empty', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_ready',
        recordingStatus: 'ready',
        transcriptStatus: 'ready',
        transcriptText: null,
        transcriptSegments: [],
      }),
    );

    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /text and timestamped segments are not available yet/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('disables replace when mount status has upload but task window is closed', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
      }),
    );

    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={closedGate}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/day closed\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeDisabled();
  });

  it('allows retry after init failure', async () => {
    initHandoffUploadMock
      .mockRejectedValueOnce(new Error('Init failed'))
      .mockResolvedValueOnce({
        recordingId: 'rec_123',
        uploadUrl: 'https://storage.example.com/signed',
        expiresInSeconds: 900,
      });

    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    selectVideo(container);
    await waitFor(() => {
      expect(screen.getByText(/init failed/i)).toBeInTheDocument();
    });
    expect(completeHandoffUploadMock).not.toHaveBeenCalled();

    selectVideo(container, 'retry.mp4');
    await waitFor(() => {
      expect(initHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });
  });

  it('allows retry after signed URL upload failure', async () => {
    uploadFileToSignedUrlMock
      .mockRejectedValueOnce(new Error('Signed URL upload failed'))
      .mockResolvedValueOnce(undefined);

    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    selectVideo(container);
    await waitFor(() => {
      expect(screen.getByText(/signed url upload failed/i)).toBeInTheDocument();
    });
    expect(completeHandoffUploadMock).toHaveBeenCalledTimes(0);

    selectVideo(container, 'retry-upload.mp4');
    await waitFor(() => {
      expect(uploadFileToSignedUrlMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });
  });

  it('allows retry after complete failure without false uploaded state', async () => {
    completeHandoffUploadMock
      .mockRejectedValueOnce(new Error('Complete failed'))
      .mockResolvedValueOnce({
        recordingId: 'rec_456',
        status: 'uploaded',
      });
    initHandoffUploadMock
      .mockResolvedValueOnce({
        recordingId: 'rec_123',
        uploadUrl: 'https://storage.example.com/signed1',
        expiresInSeconds: 900,
      })
      .mockResolvedValueOnce({
        recordingId: 'rec_456',
        uploadUrl: 'https://storage.example.com/signed2',
        expiresInSeconds: 900,
      });

    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    selectVideo(container);
    await waitFor(() => {
      expect(screen.getByText(/complete failed/i)).toBeInTheDocument();
    });
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload video/i })).toBeEnabled();

    selectVideo(container, 'retry-complete.mp4');
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });
  });

  it('uses persisted preview for latest attempt after status refresh', async () => {
    getHandoffStatusMock
      .mockResolvedValueOnce(emptyStatus)
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: 'rec_123',
          recordingStatus: 'uploaded',
          recordingDownloadUrl: 'https://cdn.example.com/rec_123.mp4',
        }),
      );

    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    selectVideo(container);
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      const video = container.querySelector('video');
      expect(video?.getAttribute('src')).toBe(
        'https://cdn.example.com/rec_123.mp4',
      );
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://handoff-preview');
  });

  it('does not enforce a hard client-side upload-size cap', async () => {
    const oversizedFile = {
      name: 'oversized.mp4',
      type: 'video/mp4',
      size: 350 * 1024 * 1024,
    } as File;
    const { container } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(getFileInput(container), {
      target: {
        files: [oversizedFile],
      },
    });

    await waitFor(() => {
      expect(initHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    expect(initHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sizeBytes: oversizedFile.size,
      }),
    );
    expect(screen.queryByText(/file exceeds/i)).not.toBeInTheDocument();
  });

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

    const { container, unmount } = render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(1);
    });

    selectVideo(container, 'first.mp4');
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(container.querySelector('video')).toBeInTheDocument();
    });

    selectVideo(container, 'second.mp4');
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-1');

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-2');
  });
});
