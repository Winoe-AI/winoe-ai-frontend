import type { Dispatch } from 'react';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import {
  completeHandoffUpload,
  initHandoffUpload,
  uploadFileToSignedUrl,
} from './handoffApi';
import { toUploadErrorMessage } from './panelUtils';
import type { HandoffUploadAction } from './handoffUploadMachine';

type Params = {
  candidateSessionId: number | null;
  taskId: number;
  pendingCompleteRecordingId: string | null;
  supplementalFiles: File[];
  consentChecked: boolean;
  aiNoticeVersion: string;
  windowClosed: boolean;
  windowClosedMessage: string;
  dispatch: Dispatch<HandoffUploadAction>;
  onTaskWindowClosed?: (err: unknown) => void;
  refreshStatus: () => Promise<unknown> | unknown;
  setCompletingUpload: (value: boolean) => void;
  setPendingCompleteRecordingId: (value: string | null) => void;
  setSupplementalFiles: (value: File[]) => void;
  setConsentChecked: (value: boolean) => void;
  setConsentValidation: (value: string | null) => void;
};

async function uploadSupplementalMaterials({
  taskId,
  candidateSessionId,
  files,
}: {
  taskId: number;
  candidateSessionId: number;
  files: File[];
}) {
  for (const file of files) {
    const init = await initHandoffUpload({
      taskId,
      candidateSessionId,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      filename: file.name,
      assetType: 'supplemental',
    });
    await uploadFileToSignedUrl({
      uploadUrl: init.uploadUrl,
      file,
    });
    await completeHandoffUpload({
      taskId,
      candidateSessionId,
      recordingId: init.recordingId,
    });
  }
}

export async function runHandoffUploadCompletion({
  candidateSessionId,
  taskId,
  pendingCompleteRecordingId,
  supplementalFiles,
  consentChecked,
  aiNoticeVersion,
  windowClosed,
  windowClosedMessage,
  dispatch,
  onTaskWindowClosed,
  refreshStatus,
  setCompletingUpload,
  setPendingCompleteRecordingId,
  setSupplementalFiles,
  setConsentChecked,
  setConsentValidation,
}: Params) {
  dispatch({ type: 'CLEAR_ERROR' });
  if (!pendingCompleteRecordingId) return;

  if (candidateSessionId === null) {
    dispatch({
      type: 'UPLOAD_FAILED',
      message: 'Session is unavailable. Refresh and try again.',
    });
    return;
  }
  if (windowClosed) {
    dispatch({ type: 'WINDOW_CLOSED', message: windowClosedMessage });
    return;
  }
  if (!consentChecked) {
    setConsentValidation('Consent is required to complete upload.');
    return;
  }

  setCompletingUpload(true);
  setConsentValidation(null);
  try {
    await completeHandoffUpload({
      taskId,
      candidateSessionId,
      recordingId: pendingCompleteRecordingId,
      consent: { consented: true, aiNoticeVersion },
    });
    await uploadSupplementalMaterials({
      taskId,
      candidateSessionId,
      files: supplementalFiles,
    });
    setPendingCompleteRecordingId(null);
    setSupplementalFiles([]);
    setConsentChecked(false);
    void refreshStatus();
  } catch (err) {
    const windowOverride = extractTaskWindowClosedOverride(err);
    if (windowOverride) {
      onTaskWindowClosed?.(err);
      dispatch({
        type: 'WINDOW_CLOSED',
        message: formatComeBackMessage(windowOverride),
      });
      return;
    }
    dispatch({
      type: 'UPLOAD_FAILED',
      message: toUploadErrorMessage(
        err,
        'Unable to save the final submission right now. Please retry.',
      ),
    });
  } finally {
    setCompletingUpload(false);
  }
}
