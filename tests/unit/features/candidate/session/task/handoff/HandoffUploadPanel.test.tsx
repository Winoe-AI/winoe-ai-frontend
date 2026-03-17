import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { HandoffUploadPanel } from '@/features/candidate/session/task/handoff/HandoffUploadPanel';
import type { HandoffStatusResponse } from '@/features/candidate/session/task/handoff/handoffApi';
import type { Task } from '@/features/candidate/session/task/types';

const initHandoffUploadMock = jest.fn();
const uploadFileToSignedUrlMock = jest.fn();
const completeHandoffUploadMock = jest.fn();
const deleteHandoffUploadMock = jest.fn();
const getHandoffStatusMock = jest.fn();

jest.mock('@/features/candidate/session/task/handoff/handoffApi', () => ({
  initHandoffUpload: (...args: unknown[]) => initHandoffUploadMock(...args),
  uploadFileToSignedUrl: (...args: unknown[]) =>
    uploadFileToSignedUrlMock(...args),
  completeHandoffUpload: (...args: unknown[]) =>
    completeHandoffUploadMock(...args),
  deleteHandoffUpload: (...args: unknown[]) => deleteHandoffUploadMock(...args),
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
    consentStatus: null,
    consentedAt: null,
    isDeleted: false,
    deletedAt: null,
    canDelete: null,
    deleteDisabledReason: null,
    aiNoticeVersion: null,
    aiNoticeEnabled: null,
    aiNoticeSummaryUrl: null,
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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

describe('HandoffUploadPanel', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  beforeEach(() => {
    jest.useFakeTimers();
    initHandoffUploadMock.mockReset();
    uploadFileToSignedUrlMock.mockReset();
    completeHandoffUploadMock.mockReset();
    deleteHandoffUploadMock.mockReset();
    getHandoffStatusMock.mockReset();
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
    deleteHandoffUploadMock.mockResolvedValue({
      deleted: true,
      deletedAt: '2026-03-16T10:05:00.000Z',
      status: 'deleted',
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

  it('renders AI notice with fallback version metadata', async () => {
    render(
      <HandoffUploadPanel
        candidateSessionId={77}
        task={baseTask}
        actionGate={openGate}
      />,
    );

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
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe(
      'https://cdn.example.com/rec_uploaded.mp4',
    );
  });

  it('requires consent before complete upload can run', async () => {
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
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled();
    });
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

    selectVideo(container, 'first.mp4');

    await waitFor(() => {
      expect(screen.getByText(/Init unavailable/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /replace upload/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /complete upload/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Transcript ready/i)).not.toBeInTheDocument();

    selectVideo(container, 'second.mp4');

    await waitFor(() => {
      expect(initHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled();
    });
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

    selectVideo(container, 'first.mp4');

    await waitFor(() => {
      expect(screen.getByText(/Signed URL upload failed/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /complete upload/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Transcript ready/i)).not.toBeInTheDocument();
    expect(completeHandoffUploadMock).not.toHaveBeenCalled();

    selectVideo(container, 'second.mp4');

    await waitFor(() => {
      expect(uploadFileToSignedUrlMock).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByRole('button', { name: /complete upload/i }),
    ).toBeDisabled();
    expect(completeHandoffUploadMock).not.toHaveBeenCalled();
  });

  it('keeps staged local preview and finalize step through status refresh before complete', async () => {
    (URL.createObjectURL as jest.Mock).mockReturnValueOnce(
      'blob://staged-preview',
    );
    getHandoffStatusMock
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus())
      .mockResolvedValueOnce(makeStatus());

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

    selectVideo(container, 'staged.mp4');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled();
    });
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'blob://staged-preview',
    );
    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /refresh transcript/i }),
    );

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(3);
    });
    expect(
      screen.getByRole('button', { name: /complete upload/i }),
    ).toBeDisabled();
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'blob://staged-preview',
    );
    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();
  });

  it('recovers from finalize failure and allows finalize retry on the same staged upload', async () => {
    completeHandoffUploadMock
      .mockRejectedValueOnce(new Error('Finalize failed once'))
      .mockResolvedValueOnce({
        recordingId: 'rec_123',
        status: 'uploaded',
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

    selectVideo(container, 'handoff.mp4');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeDisabled();
    });

    fireEvent.click(
      screen.getByLabelText(
        /I understand and consent to submission and processing/i,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));

    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Finalize failed once/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /complete upload/i }),
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));

    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    expect(completeHandoffUploadMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ recordingId: 'rec_123' }),
    );
    expect(completeHandoffUploadMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ recordingId: 'rec_123' }),
    );
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /complete upload/i }),
      ).not.toBeInTheDocument();
    });
    expect(container.querySelector('video')).toBeInTheDocument();
  });

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

    const staleStatus = createDeferred<HandoffStatusResponse>();
    let statusCallCount = 0;
    getHandoffStatusMock.mockImplementation(() => {
      statusCallCount += 1;
      if (statusCallCount === 1) return Promise.resolve(makeStatus());
      if (statusCallCount === 2) return staleStatus.promise;
      if (statusCallCount === 3) {
        return Promise.resolve(
          makeStatus({
            recordingId: 'rec_b',
            recordingStatus: 'uploaded',
          }),
        );
      }
      return Promise.resolve(makeStatus());
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

    selectVideo(container, 'a.mp4');
    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-a',
      );
    });

    selectVideo(container, 'b.mp4');
    await waitFor(() => {
      expect(initHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-b',
      );
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-a');

    await waitFor(() => {
      expect(getHandoffStatusMock).toHaveBeenCalledTimes(3);
    });
    await act(async () => {
      staleStatus.resolve(
        makeStatus({
          recordingId: 'rec_a',
          recordingStatus: 'uploaded',
        }),
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
    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    expect(completeHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recordingId: 'rec_b',
      }),
    );
  });

  it('replaces local preview with persisted preview after finalize using the latest upload attempt', async () => {
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

    selectVideo(container, 'a.mp4');
    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-a',
      );
    });

    selectVideo(container, 'b.mp4');
    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'blob://preview-b',
      );
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-a');

    fireEvent.click(
      screen.getByLabelText(
        /I understand and consent to submission and processing/i,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /complete upload/i }));

    await waitFor(() => {
      expect(completeHandoffUploadMock).toHaveBeenCalledWith(
        expect.objectContaining({ recordingId: 'rec_b' }),
      );
    });
    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'https://cdn.example.com/rec_b.mp4',
      );
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-b');
    expect(
      screen.queryByRole('button', { name: /complete upload/i }),
    ).not.toBeInTheDocument();
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
      expect(screen.getByRole('status')).toHaveTextContent(
        /transcript processing\.\.\./i,
      );
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

  it('opens delete confirmation and clears UI after delete succeeds', async () => {
    getHandoffStatusMock
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: 'rec_uploaded',
          recordingStatus: 'uploaded',
          recordingDownloadUrl: 'https://cdn.example.com/rec_uploaded.mp4',
          transcriptStatus: 'ready',
          transcriptText: 'Ready transcript body',
        }),
      )
      .mockResolvedValueOnce(
        makeStatus({
          recordingId: null,
          recordingStatus: 'deleted',
          isDeleted: true,
          deletedAt: '2026-03-16T10:05:00.000Z',
          transcriptStatus: 'deleted',
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
        screen.getByRole('button', { name: /^delete upload$/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^delete upload$/i }));
    expect(screen.getByText(/Delete this upload\?/i)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', {
      name: /delete upload confirmation/i,
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: /Delete upload/i }),
    );

    await waitFor(() => {
      expect(deleteHandoffUploadMock).toHaveBeenCalledTimes(1);
    });
    expect(deleteHandoffUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: baseTask.id,
        candidateSessionId: 77,
        recordingId: 'rec_uploaded',
      }),
    );
    await waitFor(() => {
      expect(screen.getByText(/Upload deleted\./i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Ready transcript body/i),
    ).not.toBeInTheDocument();
  });

  it('disables delete with backend policy reason', async () => {
    getHandoffStatusMock.mockResolvedValueOnce(
      makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        canDelete: false,
        deleteDisabledReason: 'Day 4 is closed for deletion.',
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
        screen.getByRole('button', { name: /^delete upload$/i }),
      ).toBeDisabled();
    });
    expect(
      screen.getByText(/Day 4 is closed for deletion\./i),
    ).toBeInTheDocument();
  });

  it('disables replace when task window is closed', async () => {
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
      expect(container.querySelector('video')).toBeInTheDocument();
    });

    selectVideo(container, 'second.mp4');
    await waitFor(() => {
      expect(initHandoffUploadMock).toHaveBeenCalledTimes(2);
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-1');

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://preview-2');
  });
});
