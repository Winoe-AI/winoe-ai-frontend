import { describeStatusTone } from './panelStatus';
import {
  hasHandoffPreview,
  hasHandoffRecording,
  type HandoffUploadState,
} from './handoffUploadMachine';
import {
  deriveDeleteState,
  deriveTranscriptState,
} from './deriveHandoffViewState.helpers';
import {
  deriveFinalizeDisabled,
  deriveHandoffNoticeState,
  isHandoffRecordingUnavailable,
} from './deriveHandoffViewState.notice';
type Params = {
  state: HandoffUploadState;
  candidateSessionId: number | null;
  pendingFinalize: boolean;
  consentChecked: boolean;
  completingUpload: boolean;
  deletingUpload: boolean;
  windowClosed: boolean;
  windowClosedMessage: string;
};

export function deriveHandoffViewState({
  state,
  candidateSessionId,
  pendingFinalize,
  consentChecked,
  completingUpload,
  deletingUpload,
  windowClosed,
  windowClosedMessage,
}: Params) {
  const uploading = state.phase === 'uploading';
  const hasRecording = hasHandoffRecording(state);
  const hasPreview = hasHandoffPreview(state);
  const statusPill = describeStatusTone({
    uploading,
    completing: completingUpload,
    deleting: deletingUpload,
    pendingFinalize,
    transcriptStatus: state.transcriptStatus,
    recordingStatus: state.recordingStatus,
    hasRecording,
    hasPreview,
    isDeleted: state.isDeleted,
    windowClosed,
  });
  const replaceDisabled =
    windowClosed ||
    uploading ||
    completingUpload ||
    deletingUpload ||
    candidateSessionId === null;
  const notice = deriveHandoffNoticeState(state);
  const combinedError = state.errorMessage;
  const recordingUnavailable = isHandoffRecordingUnavailable({
    state,
    hasRecording,
    hasPreview,
  });
  const transcript = deriveTranscriptState(state, pendingFinalize);
  const deletion = deriveDeleteState({
    state,
    pendingFinalize,
    windowClosed,
    windowClosedMessage,
    deletingUpload,
    uploading,
    completingUpload,
    candidateSessionId,
    hasRecording,
    hasPreview,
  });
  const finalizeDisabled = deriveFinalizeDisabled({
    completingUpload,
    deletingUpload,
    uploading,
    windowClosed,
    candidateSessionId,
    consentChecked,
    pendingFinalize,
  });
  return {
    uploading,
    hasRecording,
    hasPreview,
    statusPill,
    replaceDisabled,
    ...notice,
    combinedError,
    recordingUnavailable,
    ...transcript,
    ...deletion,
    finalizeDisabled,
  };
}
