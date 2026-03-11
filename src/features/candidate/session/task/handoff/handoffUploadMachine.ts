import type {
  HandoffStatusResponse,
  HandoffTranscriptSegment,
} from './handoffApi';

export type HandoffPanelPhase =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'error'
  | 'window_closed';

export type HandoffUploadState = {
  phase: HandoffPanelPhase;
  uploadProgressPct: number;
  recordingId: string | null;
  recordingStatus: string | null;
  previewUrl: string | null;
  previewSource: 'local' | 'persisted' | null;
  transcriptStatus: string;
  transcriptProgressPct: number | null;
  transcriptText: string | null;
  transcriptSegments: HandoffTranscriptSegment[] | null;
  errorMessage: string | null;
  windowClosedMessage: string | null;
};

export type HandoffUploadAction =
  | { type: 'STATUS_SYNCED'; payload: HandoffStatusResponse }
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_PROGRESS'; progressPct: number }
  | { type: 'UPLOAD_SUCCEEDED'; recordingId: string; previewUrl: string }
  | { type: 'UPLOAD_FAILED'; message: string }
  | { type: 'STATUS_FAILED'; message: string }
  | { type: 'WINDOW_CLOSED'; message: string }
  | { type: 'WINDOW_REOPENED' }
  | { type: 'CLEAR_ERROR' };

export const initialHandoffUploadState: HandoffUploadState = {
  phase: 'idle',
  uploadProgressPct: 0,
  recordingId: null,
  recordingStatus: null,
  previewUrl: null,
  previewSource: null,
  transcriptStatus: 'not_started',
  transcriptProgressPct: null,
  transcriptText: null,
  transcriptSegments: null,
  errorMessage: null,
  windowClosedMessage: null,
};

function normalizeStatusLabel(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function isTranscriptReady(status: string | null | undefined): boolean {
  const normalized = normalizeStatusLabel(status);
  return (
    normalized === 'ready' ||
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'done' ||
    normalized === 'succeeded' ||
    normalized === 'success'
  );
}

export function isTranscriptProcessing(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeStatusLabel(status);
  return (
    normalized === 'processing' ||
    normalized === 'queued' ||
    normalized === 'pending' ||
    normalized === 'running' ||
    normalized === 'in_progress' ||
    normalized === 'transcribing'
  );
}

export function isTranscriptFailed(status: string | null | undefined): boolean {
  const normalized = normalizeStatusLabel(status);
  return normalized === 'failed' || normalized === 'error';
}

function nextDataPhase(state: HandoffUploadState): HandoffPanelPhase {
  if (isTranscriptFailed(state.transcriptStatus)) return 'error';
  if (isRecordingFailed(state.recordingStatus)) return 'error';
  if (isTranscriptReady(state.transcriptStatus)) return 'ready';
  if (isTranscriptProcessing(state.transcriptStatus)) return 'processing';
  if (hasHandoffPreview(state)) return 'uploaded';
  if (hasHandoffRecording(state)) return 'uploaded';
  return 'idle';
}

function isRecordingProcessing(status: string | null | undefined): boolean {
  return normalizeStatusLabel(status) === 'processing';
}

function isRecordingFailed(status: string | null | undefined): boolean {
  const normalized = normalizeStatusLabel(status);
  return normalized === 'failed' || normalized === 'error';
}

export function hasHandoffRecording(state: HandoffUploadState): boolean {
  return Boolean(
    state.recordingId || normalizeStatusLabel(state.recordingStatus),
  );
}

function shouldKeepLocalPreview(
  state: HandoffUploadState,
  payload: HandoffStatusResponse,
) {
  if (state.previewSource !== 'local' || !state.previewUrl) return false;
  if (payload.recordingDownloadUrl) return false;
  if (!payload.recordingId) return true;
  return (
    Boolean(state.recordingId) && state.recordingId === payload.recordingId
  );
}

function nextDataState(
  state: HandoffUploadState,
  action: Extract<HandoffUploadAction, { type: 'STATUS_SYNCED' }>,
): HandoffUploadState {
  const keepLocalPreview = shouldKeepLocalPreview(state, action.payload);
  const nextRecordingId =
    action.payload.recordingId ?? (keepLocalPreview ? state.recordingId : null);
  const nextRecordingStatus =
    action.payload.recordingStatus ??
    (keepLocalPreview ? state.recordingStatus : null);
  const nextPreviewUrl =
    action.payload.recordingDownloadUrl ??
    (keepLocalPreview ? state.previewUrl : null);
  const nextPreviewSource = action.payload.recordingDownloadUrl
    ? 'persisted'
    : keepLocalPreview
      ? 'local'
      : null;

  return {
    ...state,
    recordingStatus: nextRecordingStatus,
    recordingId: nextRecordingId,
    previewUrl: nextPreviewUrl,
    previewSource: nextPreviewSource,
    transcriptStatus: action.payload.transcriptStatus,
    transcriptProgressPct: action.payload.transcriptProgressPct,
    transcriptText: action.payload.transcriptText,
    transcriptSegments: action.payload.transcriptSegments,
    errorMessage: null,
    uploadProgressPct:
      state.phase === 'uploading' ? state.uploadProgressPct : 0,
  };
}

function withDataPhase(state: HandoffUploadState): HandoffUploadState {
  return { ...state, phase: nextDataPhase(state) };
}

export function hasHandoffPreview(state: HandoffUploadState): boolean {
  return Boolean(state.previewUrl);
}

export function shouldPollHandoffStatus(state: HandoffUploadState): boolean {
  if (state.phase === 'window_closed') return false;
  if (!hasHandoffRecording(state)) return false;
  if (isTranscriptReady(state.transcriptStatus)) return false;
  if (isTranscriptFailed(state.transcriptStatus)) return false;
  if (isTranscriptProcessing(state.transcriptStatus)) return true;
  return isRecordingProcessing(state.recordingStatus);
}

export function handoffUploadReducer(
  state: HandoffUploadState,
  action: HandoffUploadAction,
): HandoffUploadState {
  if (action.type === 'UPLOAD_STARTED') {
    return {
      ...state,
      phase: 'uploading',
      uploadProgressPct: 0,
      errorMessage: null,
    };
  }

  if (action.type === 'UPLOAD_PROGRESS') {
    if (state.phase !== 'uploading') return state;
    return {
      ...state,
      uploadProgressPct: Math.max(0, Math.min(100, action.progressPct)),
    };
  }

  if (action.type === 'UPLOAD_SUCCEEDED') {
    return {
      ...state,
      phase: 'uploaded',
      uploadProgressPct: 100,
      recordingId: action.recordingId,
      recordingStatus: 'uploaded',
      previewUrl: action.previewUrl,
      previewSource: 'local',
      transcriptStatus: 'pending',
      transcriptProgressPct: null,
      transcriptText: null,
      transcriptSegments: null,
      errorMessage: null,
      windowClosedMessage: null,
    };
  }

  if (action.type === 'STATUS_SYNCED') {
    const nextState = nextDataState(state, action);

    if (isTranscriptFailed(nextState.transcriptStatus)) {
      if (state.phase === 'window_closed') {
        return {
          ...nextState,
          phase: 'window_closed',
          errorMessage: null,
        };
      }
      return {
        ...nextState,
        phase: 'error',
        errorMessage:
          'Transcript processing failed. Replace the upload to retry.',
      };
    }

    if (isRecordingFailed(nextState.recordingStatus)) {
      if (state.phase === 'window_closed') {
        return {
          ...nextState,
          phase: 'window_closed',
          errorMessage: null,
        };
      }
      return {
        ...nextState,
        phase: 'error',
        errorMessage:
          'Recording processing failed. Replace the upload to retry.',
      };
    }

    if (state.phase === 'window_closed') {
      return {
        ...nextState,
        phase: 'window_closed',
      };
    }

    return withDataPhase(nextState);
  }

  if (action.type === 'UPLOAD_FAILED' || action.type === 'STATUS_FAILED') {
    return {
      ...state,
      phase: 'error',
      uploadProgressPct: 0,
      errorMessage: action.message,
    };
  }

  if (action.type === 'WINDOW_CLOSED') {
    return {
      ...state,
      phase: 'window_closed',
      uploadProgressPct: 0,
      errorMessage: null,
      windowClosedMessage: action.message,
    };
  }

  if (action.type === 'WINDOW_REOPENED') {
    if (state.phase !== 'window_closed') return state;
    return withDataPhase({
      ...state,
      windowClosedMessage: null,
      errorMessage: null,
    });
  }

  if (action.type === 'CLEAR_ERROR') {
    if (state.phase === 'error') {
      return withDataPhase({
        ...state,
        errorMessage: null,
      });
    }
    return {
      ...state,
      errorMessage: null,
    };
  }

  return state;
}
