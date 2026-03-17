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
  | 'deleted'
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
  consentStatus: boolean | null;
  consentedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  canDelete: boolean | null;
  deleteDisabledReason: string | null;
  aiNoticeVersion: string | null;
  aiNoticeEnabled: boolean | null;
  aiNoticeSummaryUrl: string | null;
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
  | { type: 'DELETE_SUCCEEDED'; deletedAt: string | null }
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
  consentStatus: null,
  consentedAt: null,
  isDeleted: false,
  deletedAt: null,
  canDelete: null,
  deleteDisabledReason: null,
  aiNoticeVersion: null,
  aiNoticeEnabled: null,
  aiNoticeSummaryUrl: null,
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
  if (state.isDeleted) return 'deleted';
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
  if (state.isDeleted) return false;
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
  const payloadMarkedDeleted =
    action.payload.isDeleted || Boolean(action.payload.deletedAt);
  const keepDeletedState =
    state.isDeleted &&
    !action.payload.recordingId &&
    !action.payload.recordingDownloadUrl;
  const isDeleted = payloadMarkedDeleted || keepDeletedState;
  const keepLocalPreview = shouldKeepLocalPreview(state, action.payload);
  const keepPreview = !isDeleted && keepLocalPreview;
  const nextRecordingId = isDeleted
    ? null
    : (action.payload.recordingId ?? (keepPreview ? state.recordingId : null));
  const nextRecordingStatus = isDeleted
    ? 'deleted'
    : (action.payload.recordingStatus ??
      (keepPreview ? state.recordingStatus : null));
  const nextPreviewUrl = isDeleted
    ? null
    : (action.payload.recordingDownloadUrl ??
      (keepPreview ? state.previewUrl : null));
  const nextPreviewSource = isDeleted
    ? null
    : action.payload.recordingDownloadUrl
      ? 'persisted'
      : keepPreview
        ? 'local'
        : null;
  const nextTranscriptStatus = isDeleted
    ? action.payload.transcriptStatus || 'deleted'
    : action.payload.transcriptStatus;

  return {
    ...state,
    recordingStatus: nextRecordingStatus,
    recordingId: nextRecordingId,
    previewUrl: nextPreviewUrl,
    previewSource: nextPreviewSource,
    transcriptStatus: nextTranscriptStatus,
    transcriptProgressPct: isDeleted
      ? null
      : action.payload.transcriptProgressPct,
    transcriptText: isDeleted ? null : action.payload.transcriptText,
    transcriptSegments: isDeleted ? null : action.payload.transcriptSegments,
    consentStatus: action.payload.consentStatus,
    consentedAt: action.payload.consentedAt,
    isDeleted,
    deletedAt: action.payload.deletedAt,
    canDelete: action.payload.canDelete,
    deleteDisabledReason: action.payload.deleteDisabledReason,
    aiNoticeVersion: action.payload.aiNoticeVersion,
    aiNoticeEnabled: action.payload.aiNoticeEnabled,
    aiNoticeSummaryUrl: action.payload.aiNoticeSummaryUrl,
    errorMessage: null,
    uploadProgressPct:
      state.phase === 'uploading' ? state.uploadProgressPct : 0,
  };
}

function withDataPhase(state: HandoffUploadState): HandoffUploadState {
  return { ...state, phase: nextDataPhase(state) };
}

export function hasHandoffPreview(state: HandoffUploadState): boolean {
  if (state.isDeleted) return false;
  return Boolean(state.previewUrl);
}

export function shouldPollHandoffStatus(state: HandoffUploadState): boolean {
  if (state.phase === 'window_closed') return false;
  if (state.isDeleted) return false;
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
      isDeleted: false,
      deletedAt: null,
      deleteDisabledReason: null,
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
      transcriptStatus: 'not_started',
      transcriptProgressPct: null,
      transcriptText: null,
      transcriptSegments: null,
      isDeleted: false,
      deletedAt: null,
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

  if (action.type === 'DELETE_SUCCEEDED') {
    return {
      ...state,
      phase: 'deleted',
      uploadProgressPct: 0,
      recordingStatus: 'deleted',
      recordingId: null,
      previewUrl: null,
      previewSource: null,
      transcriptStatus: 'deleted',
      transcriptProgressPct: null,
      transcriptText: null,
      transcriptSegments: null,
      isDeleted: true,
      deletedAt: action.deletedAt,
      errorMessage: null,
      windowClosedMessage: null,
    };
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
