import type { Dispatch, MutableRefObject } from 'react';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import { initHandoffUpload, uploadFileToSignedUrl } from './handoffApi';
import {
  toUploadErrorMessage,
  validateVideoDuration,
  validateVideoFile,
} from './panelUtils';
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
};

export async function runHandoffUploadSelection({
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
}: Params) {
  dispatch({ type: 'CLEAR_ERROR' });
  setDeleteConfirmOpen(false);
  setConsentValidation(null);

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
  const validationError = validateVideoFile(file);
  if (validationError) {
    dispatch({ type: 'UPLOAD_FAILED', message: validationError });
    return;
  }

  const uploadAttempt = uploadAttemptRef.current + 1;
  uploadAttemptRef.current = uploadAttempt;
  const controller = new AbortController();
  uploadAbortRef.current?.abort();
  uploadAbortRef.current = controller;
  const isStaleAttempt = () => uploadAttemptRef.current !== uploadAttempt;
  clearOwnedPreviewUrl();
  const previewUrl = URL.createObjectURL(file);
  ownedPreviewUrlRef.current = previewUrl;

  try {
    dispatch({
      type: 'VIDEO_VALIDATION_STARTED',
      fileName: file.name,
      fileSizeBytes: file.size,
    });
    const durationSeconds = await validateVideoDuration(file, previewUrl);
    if (isStaleAttempt()) return;
    dispatch({ type: 'VIDEO_VALIDATION_SUCCEEDED', durationSeconds });
    dispatch({ type: 'UPLOAD_STARTED' });

    const init = await initHandoffUpload({
      taskId,
      candidateSessionId,
      contentType: file.type,
      sizeBytes: file.size,
      filename: file.name,
      durationSeconds,
    });
    if (isStaleAttempt()) return;

    await uploadFileToSignedUrl({
      uploadUrl: init.uploadUrl,
      file,
      signal: controller.signal,
      onProgress: (pct) =>
        dispatch({ type: 'UPLOAD_PROGRESS', progressPct: pct }),
    });
    if (isStaleAttempt()) return;

    dispatch({
      type: 'UPLOAD_SUCCEEDED',
      recordingId: init.recordingId,
      previewUrl,
    });
    setPendingCompleteRecordingId(init.recordingId);
    setConsentValidation(null);
    void refreshStatus();
  } catch (err) {
    if (isStaleAttempt()) return;
    clearOwnedPreviewUrl();
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
      message: toUploadErrorMessage(err, 'Video upload failed. Please retry.'),
    });
  } finally {
    if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
  }
}
