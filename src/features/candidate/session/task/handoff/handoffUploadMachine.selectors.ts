import type { HandoffUploadState } from './handoffUploadMachine.types';
import {
  isRecordingProcessing,
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
  normalizeStatusLabel,
} from './handoffUploadMachine.status';

export function hasHandoffRecording(state: HandoffUploadState): boolean {
  if (state.isDeleted) return false;
  return Boolean(state.recordingId || normalizeStatusLabel(state.recordingStatus));
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
