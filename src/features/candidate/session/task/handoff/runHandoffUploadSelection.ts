import type { Dispatch, MutableRefObject } from 'react';
import { extractTaskWindowClosedOverride, formatComeBackMessage } from '../../lib/windowState';
import { initHandoffUpload, uploadFileToSignedUrl } from './handoffApi';
import { toUploadErrorMessage, validateVideoFile } from './panelUtils';
import type { HandoffUploadAction } from './handoffUploadMachine';

type Params = {
  file: File;
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

export async function runHandoffUploadSelection({
  file, candidateSessionId, taskId, windowClosed, windowClosedMessage, dispatch,
  onTaskWindowClosed, refreshStatus, clearOwnedPreviewUrl, ownedPreviewUrlRef,
  uploadAbortRef, uploadAttemptRef, setDeleteConfirmOpen, setConsentValidation,
  setPendingCompleteRecordingId, setConsentChecked,
}: Params) {
  dispatch({ type: 'CLEAR_ERROR' });
  setDeleteConfirmOpen(false);
  setConsentValidation(null);

  if (candidateSessionId === null) {
    dispatch({ type: 'UPLOAD_FAILED', message: 'Session is unavailable. Refresh and try again.' });
    return;
  }
  if (windowClosed) {
    dispatch({ type: 'WINDOW_CLOSED', message: windowClosedMessage });
    return;
  }
  const validationError = validateVideoFile(file);
  if (validationError) {
    dispatch({ type: 'UPLOAD_FAILED', message: validationError });
    return;
  }

  dispatch({ type: 'UPLOAD_STARTED' });
  const uploadAttempt = uploadAttemptRef.current + 1;
  uploadAttemptRef.current = uploadAttempt;
  const controller = new AbortController();
  uploadAbortRef.current?.abort();
  uploadAbortRef.current = controller;
  const isStaleAttempt = () => uploadAttemptRef.current !== uploadAttempt;

  try {
    const init = await initHandoffUpload({
      taskId,
      candidateSessionId,
      contentType: file.type,
      sizeBytes: file.size,
      filename: file.name,
    });
    if (isStaleAttempt()) return;

    await uploadFileToSignedUrl({
      uploadUrl: init.uploadUrl,
      file,
      signal: controller.signal,
      onProgress: (pct) => dispatch({ type: 'UPLOAD_PROGRESS', progressPct: pct }),
    });
    if (isStaleAttempt()) return;

    clearOwnedPreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    ownedPreviewUrlRef.current = previewUrl;
    dispatch({ type: 'UPLOAD_SUCCEEDED', recordingId: init.recordingId, previewUrl });
    setPendingCompleteRecordingId(init.recordingId);
    setConsentChecked(false);
    setConsentValidation(null);
    void refreshStatus();
  } catch (err) {
    if (isStaleAttempt()) return;
    const windowOverride = extractTaskWindowClosedOverride(err);
    if (windowOverride) {
      onTaskWindowClosed?.(err);
      dispatch({ type: 'WINDOW_CLOSED', message: formatComeBackMessage(windowOverride) });
      return;
    }
    dispatch({ type: 'UPLOAD_FAILED', message: toUploadErrorMessage(err, 'Video upload failed. Please retry.') });
  } finally {
    if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
  }
}
