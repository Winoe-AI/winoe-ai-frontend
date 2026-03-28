import {
  isTranscriptProcessing,
  isTranscriptReady,
  type HandoffUploadState,
} from './handoffUploadMachine';

type TranscriptState = {
  showTranscript: boolean;
  showProcessing: boolean;
  transcriptSegments: NonNullable<HandoffUploadState['transcriptSegments']>;
  hasTranscriptText: boolean;
  hasTranscriptSegments: boolean;
};

type DeleteState = {
  canDeleteAction: boolean;
  deleteDisabledReason: string | null;
  deleteDisabled: boolean;
};

export function deriveTranscriptState(
  state: HandoffUploadState,
  pendingFinalize: boolean,
): TranscriptState {
  const showTranscript =
    !state.isDeleted &&
    isTranscriptReady(state.transcriptStatus) &&
    !pendingFinalize;
  const showProcessing =
    !state.isDeleted &&
    !pendingFinalize &&
    isTranscriptProcessing(state.transcriptStatus) &&
    !isTranscriptReady(state.transcriptStatus);
  const transcriptSegments = state.transcriptSegments ?? [];

  return {
    showTranscript,
    showProcessing,
    transcriptSegments,
    hasTranscriptText: Boolean(state.transcriptText?.trim()),
    hasTranscriptSegments: transcriptSegments.length > 0,
  };
}

export function deriveDeleteState(params: {
  state: HandoffUploadState;
  pendingFinalize: boolean;
  windowClosed: boolean;
  windowClosedMessage: string;
  deletingUpload: boolean;
  uploading: boolean;
  completingUpload: boolean;
  candidateSessionId: number | null;
  hasRecording: boolean;
  hasPreview: boolean;
}): DeleteState {
  const {
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
  } = params;
  const canDeleteAction =
    !state.isDeleted && (hasRecording || hasPreview) && !pendingFinalize;
  const deleteBlockedByWindow = windowClosed && state.canDelete !== true;
  const deleteAllowed = state.canDelete ?? !deleteBlockedByWindow;
  const deleteDisabledReason =
    state.deleteDisabledReason ??
    (deleteBlockedByWindow ? windowClosedMessage : null);
  const deleteDisabled =
    deletingUpload ||
    uploading ||
    completingUpload ||
    candidateSessionId === null ||
    !deleteAllowed;
  return { canDeleteAction, deleteDisabledReason, deleteDisabled };
}
