import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandoffUploadState } from './handoffUploadMachine';

export function useHandoffUploadActionState(state: HandoffUploadState) {
  const [pendingCompleteRecordingId, setPendingCompleteRecordingId] = useState<
    string | null
  >(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentValidation, setConsentValidation] = useState<string | null>(
    null,
  );
  const [completingUpload, setCompletingUpload] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingUpload, setDeletingUpload] = useState(false);
  const [supplementalFiles, setSupplementalFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supplementalInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const uploadAttemptRef = useRef(0);
  const ownedPreviewUrlRef = useRef<string | null>(null);

  const clearOwnedPreviewUrl = useCallback(() => {
    const current = ownedPreviewUrlRef.current;
    if (!current) return;
    URL.revokeObjectURL(current);
    ownedPreviewUrlRef.current = null;
  }, []);

  useEffect(() => {
    const uploadAbortController = uploadAbortRef.current;
    return () => {
      uploadAbortController?.abort();
      clearOwnedPreviewUrl();
    };
  }, [clearOwnedPreviewUrl]);

  useEffect(() => {
    const owned = ownedPreviewUrlRef.current;
    if (!owned) return;
    const stillActiveLocalPreview =
      state.previewSource === 'local' && state.previewUrl === owned;
    if (stillActiveLocalPreview) return;
    URL.revokeObjectURL(owned);
    ownedPreviewUrlRef.current = null;
  }, [state.previewSource, state.previewUrl]);

  useEffect(() => {
    if (!pendingCompleteRecordingId) return;
    if (state.previewSource !== 'persisted') return;
    const timer = window.setTimeout(() => {
      setPendingCompleteRecordingId(null);
      setConsentChecked(false);
      setConsentValidation(null);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [pendingCompleteRecordingId, state.previewSource]);

  return {
    pendingCompleteRecordingId,
    setPendingCompleteRecordingId,
    consentChecked,
    setConsentChecked,
    consentValidation,
    setConsentValidation,
    completingUpload,
    setCompletingUpload,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deletingUpload,
    setDeletingUpload,
    supplementalFiles,
    setSupplementalFiles,
    fileInputRef,
    supplementalInputRef,
    uploadAbortRef,
    uploadAttemptRef,
    ownedPreviewUrlRef,
    clearOwnedPreviewUrl,
  };
}
