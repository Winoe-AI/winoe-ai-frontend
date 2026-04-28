import type { HandoffStatusResponse } from './handoffApi';
import {
  hasHandoffPreview,
  hasHandoffRecording,
} from './handoffUploadMachine.selectors';
import {
  isRecordingFailed,
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
} from './handoffUploadMachine.status';
import type {
  HandoffPanelPhase,
  HandoffUploadAction,
  HandoffUploadState,
} from './handoffUploadMachine.types';

function shouldKeepLocalPreview(
  state: HandoffUploadState,
  payload: HandoffStatusResponse,
): boolean {
  if (state.previewSource !== 'local' || !state.previewUrl) return false;
  if (payload.recordingDownloadUrl) return false;
  if (!payload.recordingId) return true;
  return (
    Boolean(state.recordingId) && state.recordingId === payload.recordingId
  );
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

export function withDataPhase(state: HandoffUploadState): HandoffUploadState {
  return { ...state, phase: nextDataPhase(state) };
}

export function nextDataState(
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
  const keepPreview =
    !isDeleted && shouldKeepLocalPreview(state, action.payload);
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

  return {
    ...state,
    recordingStatus: nextRecordingStatus,
    recordingId: nextRecordingId,
    previewUrl: nextPreviewUrl,
    previewSource: isDeleted
      ? null
      : action.payload.recordingDownloadUrl
        ? 'persisted'
        : keepPreview
          ? 'local'
          : null,
    transcriptStatus: isDeleted
      ? action.payload.transcriptStatus || 'deleted'
      : action.payload.transcriptStatus,
    transcriptProgressPct: isDeleted
      ? null
      : action.payload.transcriptProgressPct,
    transcriptText: isDeleted ? null : action.payload.transcriptText,
    transcriptSegments: isDeleted ? null : action.payload.transcriptSegments,
    supplementalMaterials: isDeleted
      ? null
      : action.payload.supplementalMaterials,
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
