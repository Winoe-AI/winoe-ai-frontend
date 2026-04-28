import { useCallback, type ChangeEvent, type Dispatch } from 'react';
import type {
  HandoffUploadAction,
  HandoffUploadState,
} from './handoffUploadMachine';
import { useHandoffUploadActionState } from './useHandoffUploadActionState';
import { useHandoffUploadCompleteAction } from './useHandoffUploadCompleteAction';
import { useHandoffUploadDeleteAction } from './useHandoffUploadDeleteAction';
import { useHandoffUploadSelectAction } from './useHandoffUploadSelectAction';

type Params = {
  candidateSessionId: number | null;
  taskId: number;
  state: HandoffUploadState;
  windowClosed: boolean;
  windowClosedMessage: string;
  aiNoticeVersion: string;
  onTaskWindowClosed?: (err: unknown) => void;
  refreshStatus: () => Promise<unknown> | unknown;
  dispatch: Dispatch<HandoffUploadAction>;
};

export function useHandoffUploadActions({
  candidateSessionId,
  taskId,
  state,
  windowClosed,
  windowClosedMessage,
  aiNoticeVersion,
  onTaskWindowClosed,
  refreshStatus,
  dispatch,
}: Params) {
  const actionState = useHandoffUploadActionState(state);
  const { openFilePicker, onInputChange } = useHandoffUploadSelectAction({
    fileInputRef: actionState.fileInputRef,
    candidateSessionId,
    taskId,
    windowClosed,
    windowClosedMessage,
    dispatch,
    onTaskWindowClosed,
    refreshStatus,
    clearOwnedPreviewUrl: actionState.clearOwnedPreviewUrl,
    ownedPreviewUrlRef: actionState.ownedPreviewUrlRef,
    uploadAbortRef: actionState.uploadAbortRef,
    uploadAttemptRef: actionState.uploadAttemptRef,
    setDeleteConfirmOpen: actionState.setDeleteConfirmOpen,
    setConsentValidation: actionState.setConsentValidation,
    setPendingCompleteRecordingId: actionState.setPendingCompleteRecordingId,
  });
  const onCompleteUpload = useHandoffUploadCompleteAction({
    candidateSessionId,
    taskId,
    pendingCompleteRecordingId: actionState.pendingCompleteRecordingId,
    supplementalFiles: actionState.supplementalFiles,
    consentChecked: actionState.consentChecked,
    aiNoticeVersion,
    windowClosed,
    windowClosedMessage,
    dispatch,
    onTaskWindowClosed,
    refreshStatus,
    setCompletingUpload: actionState.setCompletingUpload,
    setPendingCompleteRecordingId: actionState.setPendingCompleteRecordingId,
    setSupplementalFiles: actionState.setSupplementalFiles,
    setConsentChecked: actionState.setConsentChecked,
    setConsentValidation: actionState.setConsentValidation,
  });
  const onConfirmDelete = useHandoffUploadDeleteAction({
    candidateSessionId,
    taskId,
    recordingId: state.recordingId,
    dispatch,
    onTaskWindowClosed,
    refreshStatus,
    clearOwnedPreviewUrl: actionState.clearOwnedPreviewUrl,
    setDeletingUpload: actionState.setDeletingUpload,
    setPendingCompleteRecordingId: actionState.setPendingCompleteRecordingId,
    setConsentChecked: actionState.setConsentChecked,
    setConsentValidation: actionState.setConsentValidation,
    setDeleteConfirmOpen: actionState.setDeleteConfirmOpen,
  });
  const clearErrorAndRefresh = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
    void refreshStatus();
  }, [dispatch, refreshStatus]);

  const onOpenDeleteConfirm = () => {
    actionState.setDeleteConfirmOpen(true);
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const openSupplementalFilePicker = useCallback(() => {
    actionState.supplementalInputRef.current?.click();
  }, [actionState.supplementalInputRef]);

  const onSupplementalInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      actionState.setSupplementalFiles(files);
    },
    [actionState],
  );

  return {
    fileInputRef: actionState.fileInputRef,
    supplementalInputRef: actionState.supplementalInputRef,
    supplementalFiles: actionState.supplementalFiles,
    setSupplementalFiles: actionState.setSupplementalFiles,
    pendingFinalize: actionState.pendingCompleteRecordingId !== null,
    consentChecked: actionState.consentChecked,
    setConsentChecked: actionState.setConsentChecked,
    consentValidation: actionState.consentValidation,
    setConsentValidation: actionState.setConsentValidation,
    completingUpload: actionState.completingUpload,
    deleteConfirmOpen: actionState.deleteConfirmOpen,
    setDeleteConfirmOpen: actionState.setDeleteConfirmOpen,
    deletingUpload: actionState.deletingUpload,
    openFilePicker,
    onInputChange,
    onCompleteUpload,
    onConfirmDelete,
    clearErrorAndRefresh,
    onOpenDeleteConfirm,
    openSupplementalFilePicker,
    onSupplementalInputChange,
  };
}
