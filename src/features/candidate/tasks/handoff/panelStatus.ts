import type { StatusPillTone } from '@/shared/status/types';
import {
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
} from './handoffUploadMachine';
import { RECORDING_UNAVAILABLE_STATES } from './panelConstants';

export function normalizeLabel(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function isRecordingUnavailable(
  status: string | null | undefined,
): boolean {
  return RECORDING_UNAVAILABLE_STATES.has(normalizeLabel(status));
}

type StatusToneState = {
  validating?: boolean;
  uploading: boolean;
  completing: boolean;
  deleting: boolean;
  pendingFinalize: boolean;
  transcriptStatus: string;
  recordingStatus: string | null;
  hasRecording: boolean;
  hasPreview: boolean;
  isDeleted: boolean;
  windowClosed: boolean;
};

export function describeStatusTone(state: StatusToneState): {
  label: string;
  tone: StatusPillTone;
} {
  const recordingStatus = normalizeLabel(state.recordingStatus);
  if (state.windowClosed) return { label: 'Window closed', tone: 'warning' };
  if (state.deleting) return { label: 'Deleting upload', tone: 'warning' };
  if (state.isDeleted) return { label: 'Deleted', tone: 'muted' };
  if (state.validating) return { label: 'Checking video', tone: 'info' };
  if (state.uploading) return { label: 'Uploading', tone: 'info' };
  if (state.completing) return { label: 'Finalizing upload', tone: 'info' };
  if (state.pendingFinalize)
    return { label: 'Ready to finalize', tone: 'warning' };
  if (recordingStatus === 'uploading')
    return { label: 'Upload started', tone: 'info' };
  if (isTranscriptFailed(state.transcriptStatus))
    return { label: 'Transcript failed', tone: 'warning' };
  if (isTranscriptReady(state.transcriptStatus))
    return { label: 'Transcript processed', tone: 'success' };
  if (isTranscriptProcessing(state.transcriptStatus))
    return { label: 'Transcript processing', tone: 'info' };
  if (state.hasRecording || state.hasPreview)
    return { label: 'Uploaded', tone: 'muted' };
  return { label: 'No upload yet', tone: 'muted' };
}
