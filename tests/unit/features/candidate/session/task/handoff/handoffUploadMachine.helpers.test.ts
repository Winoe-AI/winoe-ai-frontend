import {
  handoffUploadReducer,
  initialHandoffUploadState,
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
  shouldPollHandoffStatus,
} from '@/features/candidate/session/task/handoff/handoffUploadMachine';
import { makeStatus } from './handoffUploadMachine.testlib';

describe('handoffUploadMachine helpers', () => {
  it('evaluates transcript helper predicates', () => {
    expect(isTranscriptReady('ready')).toBe(true);
    expect(isTranscriptProcessing('processing')).toBe(true);
    expect(isTranscriptFailed('failed')).toBe(true);
  });

  it('clears stale preview when backend points to different recording', () => {
    const uploaded = handoffUploadReducer(initialHandoffUploadState, {
      type: 'UPLOAD_SUCCEEDED',
      recordingId: 'rec_old',
      previewUrl: 'blob://old-preview',
    });
    const synced = handoffUploadReducer(uploaded, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({ recordingId: 'rec_new', recordingStatus: 'uploaded', transcriptStatus: 'pending' }),
    });
    expect(synced.recordingId).toBe('rec_new');
    expect(synced.previewUrl).toBeNull();
  });

  it('supports window closed and reopened transitions', () => {
    const closed = handoffUploadReducer(initialHandoffUploadState, { type: 'WINDOW_CLOSED', message: 'Window closed' });
    const reopened = handoffUploadReducer(closed, { type: 'WINDOW_REOPENED' });
    expect(closed.phase).toBe('window_closed');
    expect(reopened.phase).toBe('idle');
  });

  it('polls only for pending statuses and stops on ready/closed', () => {
    const pending = handoffUploadReducer(initialHandoffUploadState, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({ recordingId: 'rec_9', recordingStatus: 'uploaded', transcriptStatus: 'pending' }),
    });
    const ready = handoffUploadReducer(pending, {
      type: 'STATUS_SYNCED',
      payload: makeStatus({ recordingId: 'rec_9', recordingStatus: 'ready', transcriptStatus: 'ready' }),
    });
    const closed = handoffUploadReducer(pending, { type: 'WINDOW_CLOSED', message: 'Closed' });

    expect(shouldPollHandoffStatus(pending)).toBe(true);
    expect(shouldPollHandoffStatus(ready)).toBe(false);
    expect(shouldPollHandoffStatus(closed)).toBe(false);
  });
});
