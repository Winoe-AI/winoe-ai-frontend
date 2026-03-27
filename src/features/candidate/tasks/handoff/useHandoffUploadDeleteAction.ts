import { useCallback, type Dispatch } from 'react';
import { runHandoffUploadDelete } from './runHandoffUploadDelete';
import type { HandoffUploadAction } from './handoffUploadMachine';

type Params = {
  candidateSessionId: number | null;
  taskId: number;
  recordingId: string | null;
  dispatch: Dispatch<HandoffUploadAction>;
  onTaskWindowClosed?: (err: unknown) => void;
  refreshStatus: () => Promise<unknown> | unknown;
  clearOwnedPreviewUrl: () => void;
  setDeletingUpload: (value: boolean) => void;
  setPendingCompleteRecordingId: (value: string | null) => void;
  setConsentChecked: (value: boolean) => void;
  setConsentValidation: (value: string | null) => void;
  setDeleteConfirmOpen: (value: boolean) => void;
};

export function useHandoffUploadDeleteAction({
  candidateSessionId,
  taskId,
  recordingId,
  dispatch,
  onTaskWindowClosed,
  refreshStatus,
  clearOwnedPreviewUrl,
  setDeletingUpload,
  setPendingCompleteRecordingId,
  setConsentChecked,
  setConsentValidation,
  setDeleteConfirmOpen,
}: Params) {
  return useCallback(async () => {
    await runHandoffUploadDelete({
      candidateSessionId,
      taskId,
      recordingId,
      dispatch,
      onTaskWindowClosed,
      refreshStatus,
      clearOwnedPreviewUrl,
      setDeletingUpload,
      setPendingCompleteRecordingId,
      setConsentChecked,
      setConsentValidation,
      setDeleteConfirmOpen,
    });
  }, [
    candidateSessionId,
    taskId,
    recordingId,
    dispatch,
    onTaskWindowClosed,
    refreshStatus,
    clearOwnedPreviewUrl,
    setDeletingUpload,
    setPendingCompleteRecordingId,
    setConsentChecked,
    setConsentValidation,
    setDeleteConfirmOpen,
  ]);
}
