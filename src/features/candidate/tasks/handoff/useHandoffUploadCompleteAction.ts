import { useCallback, type Dispatch } from 'react';
import { runHandoffUploadCompletion } from './runHandoffUploadCompletion';
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

export function useHandoffUploadCompleteAction({
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
  return useCallback(async () => {
    await runHandoffUploadCompletion({
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
    });
  }, [
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
  ]);
}
