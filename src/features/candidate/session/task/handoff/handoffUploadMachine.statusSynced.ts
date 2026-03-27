import { nextDataState, withDataPhase } from './handoffUploadMachine.dataState';
import {
  isRecordingFailed,
  isTranscriptFailed,
} from './handoffUploadMachine.status';
import type {
  HandoffUploadAction,
  HandoffUploadState,
} from './handoffUploadMachine.types';

export function reduceStatusSynced(
  state: HandoffUploadState,
  action: Extract<HandoffUploadAction, { type: 'STATUS_SYNCED' }>,
): HandoffUploadState {
  const nextState = nextDataState(state, action);
  if (isTranscriptFailed(nextState.transcriptStatus)) {
    if (state.phase === 'window_closed') {
      return { ...nextState, phase: 'window_closed', errorMessage: null };
    }
    return {
      ...nextState,
      phase: 'error',
      errorMessage: 'Transcript processing failed. Replace the upload to retry.',
    };
  }
  if (isRecordingFailed(nextState.recordingStatus)) {
    if (state.phase === 'window_closed') {
      return { ...nextState, phase: 'window_closed', errorMessage: null };
    }
    return {
      ...nextState,
      phase: 'error',
      errorMessage: 'Recording processing failed. Replace the upload to retry.',
    };
  }
  if (state.phase === 'window_closed') return { ...nextState, phase: 'window_closed' };
  return withDataPhase(nextState);
}
