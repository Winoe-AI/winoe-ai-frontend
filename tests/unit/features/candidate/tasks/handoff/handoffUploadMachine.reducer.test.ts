import {
  handoffUploadReducer,
  hasHandoffPreview,
  hasHandoffRecording,
  initialHandoffUploadState,
  shouldPollHandoffStatus,
} from '@/features/candidate/tasks/handoff/handoffUploadMachine';
import { makeStatus } from './handoffUploadMachine.testlib';

describe('handoffUploadMachine reducer transitions', () => {
  it('tracks upload start, progress, and success transitions', () => {
    const started = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_STARTED',
    });
    const progressed = handoffUploadReducer(started, {
      type: 'UPLOAD_PROGRESS',
      progressPct: 37,
    });
    const uploaded = handoffUploadReducer(progressed, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_123',
      previewUrl: 'blob://preview',
    });

    expect(started.phase).toBe('uploading');
    expect(progressed.uploadProgressPct).toBe(37);
    expect(uploaded.phase).toBe('uploaded');
    expect(uploaded.recordingId).toBe('rec_123');
  });

  it('hydrates uploaded status without preview URL', () => {
    const hydrated = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_uploaded',
        recordingStatus: 'uploaded',
        transcriptStatus: 'not_started',
      }),
    });
    expect(hydrated.phase).toBe('uploaded');
    expect(hasHandoffRecording(hydrated)).toBe(true);
    expect(hasHandoffPreview(hydrated)).toBe(false);
  });

  it('moves from processing to ready based on polling payloads', () => {
    const processing = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_1',
        recordingStatus: 'processing',
        transcriptStatus: 'processing',
        transcriptProgressPct: 70,
      }),
    });
    const ready = handoffUploadReducer(processing, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_1',
        recordingStatus: 'ready',
        transcriptStatus: 'ready',
      }),
    });
    expect(processing.phase).toBe('processing');
    expect(ready.phase).toBe('ready');
  });

  it('reports transcript and recording failures as error phases', () => {
    const transcriptFailed = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_2',
        recordingStatus: 'failed',
        transcriptStatus: 'failed',
      }),
    });
    const recordingFailed = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_3',
        recordingStatus: 'failed',
        transcriptStatus: 'not_started',
      }),
    });
    expect(transcriptFailed.phase).toBe('error');
    expect(recordingFailed.phase).toBe('error');
  });

  it('reconciles local and persisted preview URLs correctly', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_same',
      previewUrl: 'blob://local-preview',
    });
    const persisted = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_same',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: 'https://cdn.example.com/rec_same.mp4',
      }),
    });
    const fallbackLocal = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({
        recordingId: 'rec_same',
        recordingStatus: 'uploaded',
        recordingDownloadUrl: null,
      }),
    });
    expect(persisted.previewSource).toBe('persisted');
    expect(fallbackLocal.previewSource).toBe('local');
  });

  it('moves to deleted state and clears media details', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_123',
      previewUrl: 'blob://preview',
    });
    const deleted = handoffUploadReducer(uploaded, {
      type: 'DELETE_SUCCEEDED',
      deletedAt: '2026-03-16T10:00:00.000Z',
    });
    expect(deleted.phase).toBe('deleted');
    expect(deleted.recordingId).toBeNull();
    expect(shouldPollHandoffStatus(deleted)).toBe(false);
  });
});
