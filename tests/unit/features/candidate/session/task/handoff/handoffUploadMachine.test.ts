import {
  handoffUploadReducer,
  hasHandoffPreview,
  hasHandoffRecording,
  initialHandoffUploadState,
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
  shouldPollHandoffStatus,
} from '@/features/candidate/session/task/handoff/handoffUploadMachine';
import type { HandoffStatusResponse } from '@/features/candidate/session/task/handoff/handoffApi';

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

describe('handoffUploadMachine', () => {
  it('tracks upload start/progress/success transitions', () => {
    const started = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_STARTED',
    });
    expect(started.phase).toBe('uploading');

    const progressed = handoffUploadReducer(started, {
      type: 'UPLOAD_PROGRESS',
      progressPct: 37,
    });
    expect(progressed.uploadProgressPct).toBe(37);

    const uploaded = handoffUploadReducer(progressed, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_123',
      previewUrl: 'blob://preview',
    });
    expect(uploaded.phase).toBe('uploaded');
    expect(uploaded.recordingId).toBe('rec_123');
    expect(uploaded.previewUrl).toBe('blob://preview');
    expect(uploaded.transcriptStatus).toBe('pending');
  });

  it('hydrates from mounted uploaded status without preview URL', () => {
    const uploadedPayload: HandoffStatusResponse = makeStatus({
      recordingId: 'rec_uploaded',
      recordingStatus: 'uploaded',
      transcriptStatus: 'not_started',
    });
    const hydrated = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: uploadedPayload,
    });

    expect(hydrated.phase).toBe('uploaded');
    expect(hydrated.recordingId).toBe('rec_uploaded');
    expect(hydrated.previewUrl).toBeNull();
    expect(hasHandoffRecording(hydrated)).toBe(true);
    expect(hasHandoffPreview(hydrated)).toBe(false);
  });

  it('moves from processing to ready based on status polling payloads', () => {
    const processing = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_1',
        recordingStatus: 'processing',
        transcriptStatus: 'processing',
        transcriptProgressPct: 70,
      }),
    });
    expect(processing.phase).toBe('processing');
    expect(processing.transcriptProgressPct).toBe(70);

    const ready = handoffUploadReducer(processing, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_1',
        recordingStatus: 'ready',
        transcriptStatus: 'ready',
      }),
    });
    expect(ready.phase).toBe('ready');
  });

  it('reports transcript failure as error', () => {
    const failed = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_2',
        recordingStatus: 'failed',
        transcriptStatus: 'failed',
      }),
    });

    expect(failed.phase).toBe('error');
    expect(failed.errorMessage).toMatch(/failed/i);
  });

  it('reports recording failure as error when transcript is missing', () => {
    const failed = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_3',
        recordingStatus: 'failed',
        transcriptStatus: 'not_started',
      }),
    });

    expect(failed.phase).toBe('error');
    expect(failed.errorMessage).toMatch(/recording processing failed/i);
  });

  it('clears stale local preview if backend status points to different recording', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_old',
      previewUrl: 'blob://old-preview',
    });

    const synced = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_new',
        recordingStatus: 'uploaded',
        transcriptStatus: 'pending',
      }),
    });

    expect(synced.recordingId).toBe('rec_new');
    expect(synced.previewUrl).toBeNull();
    expect(synced.previewSource).toBeNull();
  });

  it('hydrates persisted preview URL from status payload', () => {
    const hydrated = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: 'https://cdn.example.com/rec_uploaded.mp4',
      }),
    });

    expect(hydrated.phase).toBe('uploaded');
    expect(hydrated.previewUrl).toBe(
      'https://cdn.example.com/rec_uploaded.mp4',
    );
    expect(hydrated.previewSource).toBe('persisted');
  });

  it('supersedes local preview with persisted preview for the same recording', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_same',
      previewUrl: 'blob://local-preview',
    });

    const synced = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_same',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: 'https://cdn.example.com/rec_same.mp4',
      }),
    });

    expect(synced.previewUrl).toBe('https://cdn.example.com/rec_same.mp4');
    expect(synced.previewSource).toBe('persisted');
  });

  it('keeps local preview when persisted preview URL is temporarily unavailable', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_same',
      previewUrl: 'blob://local-preview',
    });

    const synced = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_same',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: null,
      }),
    });

    expect(synced.previewUrl).toBe('blob://local-preview');
    expect(synced.previewSource).toBe('local');
  });

  it('enters and exits window-closed state', () => {
    const closed = handoffUploadReducer(initialHandoffUploadState, {
      type: 'WINDOW_CLOSED',
      message: 'Window closed',
    });
    expect(closed.phase).toBe('window_closed');
    expect(closed.windowClosedMessage).toBe('Window closed');

    const reopened = handoffUploadReducer(closed, {
      type: 'WINDOW_REOPENED',
    });
    expect(reopened.phase).toBe('idle');
    expect(reopened.windowClosedMessage).toBeNull();
  });

  it('computes helpers and polling decisions', () => {
    expect(isTranscriptReady('ready')).toBe(true);
    expect(isTranscriptProcessing('processing')).toBe(true);
    expect(isTranscriptFailed('failed')).toBe(true);

    const pending = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_9',
        recordingStatus: 'uploaded',
        transcriptStatus: 'pending',
      }),
    });
    expect(shouldPollHandoffStatus(pending)).toBe(true);

    const ready = handoffUploadReducer(pending, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_9',
        recordingStatus: 'ready',
        transcriptStatus: 'ready',
      }),
    });
    expect(shouldPollHandoffStatus(ready)).toBe(false);

    const closed = handoffUploadReducer(pending, {
      type: 'WINDOW_CLOSED',
      message: 'Closed',
    });
    expect(shouldPollHandoffStatus(closed)).toBe(false);
  });
});
