import { useCallback, type Dispatch } from 'react';
import { runHandoffUploadCompletion } from './runHandoffUploadCompletion';
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

export function useHandoffUploadCompleteAction({
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
  return useCallback(async () => {
    await runHandoffUploadCompletion({
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
    });
  }, [
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
  ]);
}
