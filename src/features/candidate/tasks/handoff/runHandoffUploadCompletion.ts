import type { Dispatch } from 'react';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import { completeHandoffUpload } from './handoffApi';
import { toUploadErrorMessage } from './panelUtils';
import type { HandoffUploadAction } from './handoffUploadMachine';

type Params = {
  candidateSessionId: number | null;
  taskId: number;
  pendingCompleteRecordingId: string | null;
  consentChecked: boolean;
  aiNoticeVersion: string;
  windowClosed: boolean;
  windowClosedMessage: string;
  dispatch: Dispatch<HandoffUploadAction>;
  onTaskWindowClosed?: (err: unknown) => void;
  refreshStatus: () => Promise<unknown> | unknown;
  setCompletingUpload: (value: boolean) => void;
  setPendingCompleteRecordingId: (value: string | null) => void;
  setConsentChecked: (value: boolean) => void;
  setConsentValidation: (value: string | null) => void;
};

export async function runHandoffUploadCompletion({
  candidateSessionId,
  taskId,
  pendingCompleteRecordingId,
  consentChecked,
  aiNoticeVersion,
  windowClosed,
  windowClosedMessage,
  dispatch,
  onTaskWindowClosed,
  refreshStatus,
  setCompletingUpload,
  setPendingCompleteRecordingId,
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
    setPendingCompleteRecordingId(null);
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
        'Unable to complete upload right now. Please retry.',
      ),
    });
  } finally {
    setCompletingUpload(false);
  }
}
