import type { Dispatch } from 'react';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import { deleteHandoffUpload } from './handoffApi';
import { toUploadErrorMessage } from './panelUtils';
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

export async function runHandoffUploadDelete({
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
  dispatch({ type: 'CLEAR_ERROR' });
  if (candidateSessionId === null) {
    dispatch({
      type: 'UPLOAD_FAILED',
      message: 'Session is unavailable. Refresh and try again.',
    });
    return;
  }

  setDeletingUpload(true);
  try {
    const deleted = await deleteHandoffUpload({
      taskId,
      candidateSessionId,
      recordingId,
    });
    clearOwnedPreviewUrl();
    setPendingCompleteRecordingId(null);
    setConsentChecked(false);
    setConsentValidation(null);
    setDeleteConfirmOpen(false);
    dispatch({ type: 'DELETE_SUCCEEDED', deletedAt: deleted.deletedAt });
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
        'Unable to delete upload right now. Please retry.',
      ),
    });
  } finally {
    setDeletingUpload(false);
  }
}
