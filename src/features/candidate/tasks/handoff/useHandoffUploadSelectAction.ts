import {
  useCallback,
  type ChangeEvent,
  type Dispatch,
  type MutableRefObject,
} from 'react';
import { runHandoffUploadSelection } from './runHandoffUploadSelection';
import type { HandoffUploadAction } from './handoffUploadMachine';

type Params = {
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  candidateSessionId: number | null;
  taskId: number;
  windowClosed: boolean;
  windowClosedMessage: string;
  dispatch: Dispatch<HandoffUploadAction>;
  onTaskWindowClosed?: (err: unknown) => void;
  refreshStatus: () => Promise<unknown> | unknown;
  clearOwnedPreviewUrl: () => void;
  ownedPreviewUrlRef: MutableRefObject<string | null>;
  uploadAbortRef: MutableRefObject<AbortController | null>;
  uploadAttemptRef: MutableRefObject<number>;
  setDeleteConfirmOpen: (value: boolean) => void;
  setConsentValidation: (value: string | null) => void;
  setPendingCompleteRecordingId: (value: string | null) => void;
  setConsentChecked: (value: boolean) => void;
};

export function useHandoffUploadSelectAction({
  fileInputRef,
  candidateSessionId,
  taskId,
  windowClosed,
  windowClosedMessage,
  dispatch,
  onTaskWindowClosed,
  refreshStatus,
  clearOwnedPreviewUrl,
  ownedPreviewUrlRef,
  uploadAbortRef,
  uploadAttemptRef,
  setDeleteConfirmOpen,
  setConsentValidation,
  setPendingCompleteRecordingId,
  setConsentChecked,
}: Params) {
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onFileSelected = useCallback(
    async (file: File) => {
      await runHandoffUploadSelection({
        file,
        candidateSessionId,
        taskId,
        windowClosed,
        windowClosedMessage,
        dispatch,
        onTaskWindowClosed,
        refreshStatus,
        clearOwnedPreviewUrl,
        ownedPreviewUrlRef,
        uploadAbortRef,
        uploadAttemptRef,
        setDeleteConfirmOpen,
        setConsentValidation,
        setPendingCompleteRecordingId,
        setConsentChecked,
      });
    },
    [
      candidateSessionId,
      taskId,
      windowClosed,
      windowClosedMessage,
      dispatch,
      onTaskWindowClosed,
      refreshStatus,
      clearOwnedPreviewUrl,
      ownedPreviewUrlRef,
      uploadAbortRef,
      uploadAttemptRef,
      setDeleteConfirmOpen,
      setConsentValidation,
      setPendingCompleteRecordingId,
      setConsentChecked,
    ],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      void onFileSelected(file);
    },
    [onFileSelected],
  );

  return { openFilePicker, onInputChange };
}
