import { isRecordingUnavailable } from './panelStatus';
import {
  DEFAULT_NOTICE_VERSION,
  DEFAULT_RECOMMENDED_VIDEO_BYTES,
} from './panelConstants';
import { formatBytes } from './panelUtils';
import { type HandoffUploadState } from './handoffUploadMachine';

export function deriveHandoffNoticeState(state: HandoffUploadState) {
  return {
    uploadHint: `Accepted: MP4, WebM, MOV. Demo videos must be 15 minutes or shorter. Use this Handoff + Demo to explain what you built, decisions, tradeoffs, challenges, and what you would improve with more time. Recommended under ${formatBytes(DEFAULT_RECOMMENDED_VIDEO_BYTES)}; backend enforces the exact upload-size limit.`,
    aiNoticeVersion: state.aiNoticeVersion ?? DEFAULT_NOTICE_VERSION,
    aiNoticeEnabled: state.aiNoticeEnabled !== false,
    aiNoticeSummaryUrl:
      state.aiNoticeSummaryUrl ?? '/candidate/what-we-evaluate',
  };
}

export function deriveFinalizeDisabled(params: {
  completingUpload: boolean;
  deletingUpload: boolean;
  uploading: boolean;
  validating?: boolean;
  windowClosed: boolean;
  candidateSessionId: number | null;
  consentChecked: boolean;
  pendingFinalize: boolean;
}): boolean {
  return (
    params.completingUpload ||
    params.deletingUpload ||
    params.uploading ||
    Boolean(params.validating) ||
    params.windowClosed ||
    params.candidateSessionId === null ||
    !params.consentChecked ||
    !params.pendingFinalize
  );
}

export function isHandoffRecordingUnavailable(params: {
  state: HandoffUploadState;
  hasRecording: boolean;
  hasPreview: boolean;
}): boolean {
  const { state, hasRecording, hasPreview } = params;
  return (
    !state.isDeleted &&
    hasRecording &&
    !hasPreview &&
    isRecordingUnavailable(state.recordingStatus)
  );
}
