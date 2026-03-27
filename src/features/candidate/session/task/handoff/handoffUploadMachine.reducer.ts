import { withDataPhase } from './handoffUploadMachine.dataState';
import { reduceStatusSynced } from './handoffUploadMachine.statusSynced';
import type {
  HandoffUploadAction,
  HandoffUploadState,
} from './handoffUploadMachine.types';

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
    return { ...state, uploadProgressPct: Math.max(0, Math.min(100, action.progressPct)) };
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
  if (action.type === 'STATUS_SYNCED') return reduceStatusSynced(state, action);
  if (action.type === 'UPLOAD_FAILED' || action.type === 'STATUS_FAILED') {
    return { ...state, phase: 'error', uploadProgressPct: 0, errorMessage: action.message };
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
    return withDataPhase({ ...state, windowClosedMessage: null, errorMessage: null });
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
    if (state.phase === 'error') return withDataPhase({ ...state, errorMessage: null });
    return { ...state, errorMessage: null };
  }
  return state;
}
