'use client';

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import Button from '@/shared/ui/Button';
import { StatusPill } from '@/shared/ui/StatusPill';
import type { StatusPillTone } from '@/shared/status/types';
import { AiNoticeCard } from '../../components/AiNoticeCard';
import { TaskContainer } from '../components/TaskContainer';
import { TaskDescription } from '../components/TaskDescription';
import { TaskHeader } from '../components/TaskHeader';
import { TaskPanelErrorBanner } from '../components/TaskPanelErrorBanner';
import type { WindowActionGate } from '../../lib/windowState';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../../lib/windowState';
import type { Task } from '../types';
import {
  completeHandoffUpload,
  deleteHandoffUpload,
  getHandoffStatus,
  initHandoffUpload,
  type HandoffTranscriptSegment,
  uploadFileToSignedUrl,
} from './handoffApi';
import {
  handoffUploadReducer,
  hasHandoffPreview,
  hasHandoffRecording,
  initialHandoffUploadState,
  isTranscriptFailed,
  isTranscriptProcessing,
  isTranscriptReady,
  shouldPollHandoffStatus,
} from './handoffUploadMachine';

const POLL_INTERVAL_MS = 4000;
const DEFAULT_RECOMMENDED_VIDEO_BYTES = 100 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPT_INPUT_VALUE = ACCEPTED_VIDEO_TYPES.join(',');
const DEFAULT_NOTICE_VERSION = 'mvp1';
const CONSENT_HELPER_TEXT = 'Check the consent box to enable completion.';

const RECORDING_UNAVAILABLE_STATES = new Set([
  'forbidden',
  'unavailable',
  'revoked',
  'deleted',
  'not_found',
  'gone',
]);

type Props = {
  candidateSessionId: number | null;
  task: Task;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
};

function normalizeLabel(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isRecordingUnavailable(status: string | null | undefined): boolean {
  return RECORDING_UNAVAILABLE_STATES.has(normalizeLabel(status));
}

function describeStatusTone(state: {
  uploading: boolean;
  completing: boolean;
  deleting: boolean;
  pendingFinalize: boolean;
  transcriptStatus: string;
  recordingStatus: string | null;
  hasRecording: boolean;
  hasPreview: boolean;
  isDeleted: boolean;
  windowClosed: boolean;
}): { label: string; tone: StatusPillTone } {
  const recordingStatus = normalizeLabel(state.recordingStatus);
  if (state.windowClosed) return { label: 'Window closed', tone: 'warning' };
  if (state.deleting) return { label: 'Deleting upload', tone: 'warning' };
  if (state.isDeleted) return { label: 'Deleted', tone: 'muted' };
  if (state.uploading) return { label: 'Uploading', tone: 'info' };
  if (state.completing) return { label: 'Finalizing upload', tone: 'info' };
  if (state.pendingFinalize)
    return { label: 'Ready to finalize', tone: 'warning' };
  if (recordingStatus === 'uploading')
    return { label: 'Upload started', tone: 'info' };
  if (isTranscriptFailed(state.transcriptStatus))
    return { label: 'Transcript failed', tone: 'warning' };
  if (isTranscriptReady(state.transcriptStatus))
    return { label: 'Transcript processed', tone: 'success' };
  if (isTranscriptProcessing(state.transcriptStatus))
    return { label: 'Transcript processing', tone: 'info' };
  if (state.hasRecording) return { label: 'Uploaded', tone: 'muted' };
  if (state.hasPreview) return { label: 'Uploaded', tone: 'muted' };
  return { label: 'No upload yet', tone: 'muted' };
}

function toUploadErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    const value = String((err as { message: string }).message).trim();
    if (value) return value;
  }
  return fallback;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatSegmentRange(segment: HandoffTranscriptSegment): string {
  return `${formatTimestamp(segment.startMs)} - ${formatTimestamp(segment.endMs)}`;
}

function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return 'Unsupported file type. Upload MP4, WebM, or MOV video files.';
  }
  return null;
}

export function HandoffUploadPanel({
  candidateSessionId,
  task,
  actionGate,
  onTaskWindowClosed,
}: Props) {
  const [state, dispatch] = useReducer(
    handoffUploadReducer,
    initialHandoffUploadState,
  );
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const uploadAttemptRef = useRef(0);
  const ownedPreviewUrlRef = useRef<string | null>(null);
  const statusRefreshRequestIdRef = useRef(0);
  const latestStatusRefreshAppliedRef = useRef(0);

  const clearOwnedPreviewUrl = useCallback(() => {
    const current = ownedPreviewUrlRef.current;
    if (!current) return;
    URL.revokeObjectURL(current);
    ownedPreviewUrlRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort();
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
    setPendingCompleteRecordingId(null);
    setConsentChecked(false);
    setConsentValidation(null);
  }, [pendingCompleteRecordingId, state.previewSource]);

  const refreshStatus = useCallback(async () => {
    if (candidateSessionId === null) return;
    const requestId = statusRefreshRequestIdRef.current + 1;
    statusRefreshRequestIdRef.current = requestId;

    try {
      const status = await getHandoffStatus({
        taskId: task.id,
        candidateSessionId,
      });
      if (requestId < latestStatusRefreshAppliedRef.current) return;
      latestStatusRefreshAppliedRef.current = requestId;
      dispatch({ type: 'STATUS_SYNCED', payload: status });
    } catch (err) {
      if (requestId < latestStatusRefreshAppliedRef.current) return;
      latestStatusRefreshAppliedRef.current = requestId;
      const windowClosed = extractTaskWindowClosedOverride(err);
      if (windowClosed) {
        onTaskWindowClosed?.(err);
        dispatch({
          type: 'WINDOW_CLOSED',
          message: formatComeBackMessage(windowClosed),
        });
        return;
      }
      dispatch({
        type: 'STATUS_FAILED',
        message: toUploadErrorMessage(
          err,
          'Unable to refresh upload status right now.',
        ),
      });
    }
  }, [candidateSessionId, onTaskWindowClosed, task.id]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!shouldPollHandoffStatus(state)) return;
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshStatus, state]);

  useEffect(() => {
    if (actionGate.isReadOnly) return;
    dispatch({ type: 'WINDOW_REOPENED' });
  }, [actionGate.isReadOnly]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const windowClosedFromState = state.phase === 'window_closed';
  const windowClosed = actionGate.isReadOnly || windowClosedFromState;
  const windowClosedMessage =
    state.windowClosedMessage ??
    actionGate.disabledReason ??
    'This day is currently closed outside the scheduled window.';
  const uploading = state.phase === 'uploading';
  const pendingFinalize = pendingCompleteRecordingId !== null;
  const hasRecording = hasHandoffRecording(state);
  const hasPreview = hasHandoffPreview(state);
  const statusPill = describeStatusTone({
    uploading,
    completing: completingUpload,
    deleting: deletingUpload,
    pendingFinalize,
    transcriptStatus: state.transcriptStatus,
    recordingStatus: state.recordingStatus,
    hasRecording,
    hasPreview,
    isDeleted: state.isDeleted,
    windowClosed,
  });
  const replaceDisabled =
    windowClosed ||
    uploading ||
    completingUpload ||
    deletingUpload ||
    candidateSessionId === null;
  const uploadHint = `Accepted: MP4, WebM, MOV. Recommended under ${formatBytes(DEFAULT_RECOMMENDED_VIDEO_BYTES)}; backend enforces the exact upload-size limit.`;
  const aiNoticeVersion = state.aiNoticeVersion ?? DEFAULT_NOTICE_VERSION;
  const aiNoticeEnabled = state.aiNoticeEnabled !== false;
  const aiNoticeSummaryUrl =
    state.aiNoticeSummaryUrl ?? '/candidate/what-we-evaluate';

  const onFileSelected = useCallback(
    async (file: File) => {
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
        dispatch({
          type: 'WINDOW_CLOSED',
          message: windowClosedMessage,
        });
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
          taskId: task.id,
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
          onProgress: (pct) =>
            dispatch({ type: 'UPLOAD_PROGRESS', progressPct: pct }),
        });
        if (isStaleAttempt()) return;

        clearOwnedPreviewUrl();
        const previewUrl = URL.createObjectURL(file);
        ownedPreviewUrlRef.current = previewUrl;
        dispatch({
          type: 'UPLOAD_SUCCEEDED',
          recordingId: init.recordingId,
          previewUrl,
        });
        setPendingCompleteRecordingId(init.recordingId);
        setConsentChecked(false);
        setConsentValidation(null);
        void refreshStatus();
      } catch (err) {
        if (isStaleAttempt()) return;
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
            'Video upload failed. Please retry.',
          ),
        });
      } finally {
        if (uploadAbortRef.current === controller) {
          uploadAbortRef.current = null;
        }
      }
    },
    [
      candidateSessionId,
      clearOwnedPreviewUrl,
      onTaskWindowClosed,
      refreshStatus,
      task.id,
      windowClosed,
      windowClosedMessage,
    ],
  );

  const onCompleteUpload = useCallback(async () => {
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
      dispatch({
        type: 'WINDOW_CLOSED',
        message: windowClosedMessage,
      });
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
        taskId: task.id,
        candidateSessionId,
        recordingId: pendingCompleteRecordingId,
        consent: {
          consented: true,
          aiNoticeVersion,
        },
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
  }, [
    aiNoticeVersion,
    candidateSessionId,
    consentChecked,
    onTaskWindowClosed,
    pendingCompleteRecordingId,
    refreshStatus,
    task.id,
    windowClosed,
    windowClosedMessage,
  ]);

  const onConfirmDelete = useCallback(async () => {
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
        taskId: task.id,
        candidateSessionId,
        recordingId: state.recordingId,
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
  }, [
    candidateSessionId,
    clearOwnedPreviewUrl,
    onTaskWindowClosed,
    refreshStatus,
    state.recordingId,
    task.id,
  ]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void onFileSelected(file);
  };

  const combinedError = state.errorMessage;
  const recordingUnavailable =
    !state.isDeleted &&
    hasRecording &&
    !hasPreview &&
    isRecordingUnavailable(state.recordingStatus);
  const showTranscript =
    !state.isDeleted &&
    isTranscriptReady(state.transcriptStatus) &&
    !pendingFinalize;
  const showProcessing =
    !state.isDeleted &&
    !pendingFinalize &&
    isTranscriptProcessing(state.transcriptStatus) &&
    !isTranscriptReady(state.transcriptStatus);
  const transcriptSegments = state.transcriptSegments ?? [];
  const hasTranscriptText = Boolean(
    state.transcriptText && state.transcriptText.trim(),
  );
  const hasTranscriptSegments = transcriptSegments.length > 0;

  const canDeleteAction =
    !state.isDeleted && (hasRecording || hasPreview) && !pendingFinalize;
  const deleteBlockedByWindow = windowClosed && state.canDelete !== true;
  const deleteAllowed = state.canDelete ?? !deleteBlockedByWindow;
  const deleteDisabledReason =
    state.deleteDisabledReason ??
    (deleteBlockedByWindow ? windowClosedMessage : null);
  const deleteDisabled =
    deletingUpload ||
    uploading ||
    completingUpload ||
    candidateSessionId === null ||
    !deleteAllowed;
  const finalizeDisabled =
    completingUpload ||
    deletingUpload ||
    uploading ||
    windowClosed ||
    candidateSessionId === null ||
    !consentChecked ||
    !pendingFinalize;

  return (
    <TaskContainer>
      <TaskHeader
        task={task}
        statusSlot={
          <StatusPill label={statusPill.label} tone={statusPill.tone} />
        }
      />
      <TaskDescription description={task.description} />

      <div className="mt-6 space-y-4">
        <TaskPanelErrorBanner message={combinedError} />

        {windowClosed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {windowClosedMessage}
          </div>
        ) : null}

        {aiNoticeEnabled ? (
          <AiNoticeCard
            version={aiNoticeVersion}
            summaryUrl={aiNoticeSummaryUrl}
            compact
          />
        ) : null}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-gray-900">
              Video upload
            </div>
            {showProcessing ? (
              <StatusPill label="Transcript processing..." tone="info" />
            ) : null}
            {showTranscript ? (
              <StatusPill label="Transcript ready" tone="success" />
            ) : null}
            {state.isDeleted ? (
              <StatusPill label="Deleted" tone="muted" />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-gray-600">{uploadHint}</p>

          {state.isDeleted ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
              Upload deleted. Playback and transcript are unavailable.
            </div>
          ) : null}

          {!hasRecording ? (
            <div className="mt-3">
              <Button
                variant="primary"
                onClick={openFilePicker}
                disabled={replaceDisabled}
              >
                Upload video
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={openFilePicker}
                disabled={replaceDisabled}
              >
                Replace upload
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  dispatch({ type: 'CLEAR_ERROR' });
                  void refreshStatus();
                }}
                disabled={
                  uploading ||
                  completingUpload ||
                  deletingUpload ||
                  candidateSessionId === null
                }
              >
                Refresh transcript
              </Button>
            </div>
          )}

          {hasRecording && !hasPreview && !state.isDeleted ? (
            <p className="mt-3 text-xs text-gray-600">
              {recordingUnavailable
                ? 'Playback is unavailable for this upload right now. If this continues, contact support or refresh status later.'
                : 'Upload saved. Preview is temporarily unavailable right now. Refresh status and try again shortly.'}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept={ACCEPT_INPUT_VALUE}
            onChange={onInputChange}
            disabled={replaceDisabled}
          />
        </div>

        {pendingFinalize ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-semibold text-blue-900">
              Complete upload
            </div>
            <p className="mt-1 text-sm text-blue-900">
              Your video file is uploaded. Consent is required before finalizing
              Day 4 submission.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm text-blue-900">
              <input
                className="mt-0.5"
                type="checkbox"
                checked={consentChecked}
                onChange={(event) => {
                  const next = event.target.checked;
                  setConsentChecked(next);
                  setConsentValidation(null);
                }}
              />
              <span>
                I understand and consent to submission and processing of my
                video and transcript for evaluation.
              </span>
            </label>
            {consentValidation ? (
              <p className="mt-2 text-sm text-red-700">{consentValidation}</p>
            ) : !consentChecked ? (
              <p className="mt-2 text-sm text-blue-900">
                {CONSENT_HELPER_TEXT}
              </p>
            ) : null}
            <div className="mt-3">
              <Button
                onClick={() => {
                  void onCompleteUpload();
                }}
                loading={completingUpload}
                disabled={finalizeDisabled}
              >
                Complete upload
              </Button>
            </div>
          </div>
        ) : null}

        {canDeleteAction ? (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteConfirmOpen(true);
                  dispatch({ type: 'CLEAR_ERROR' });
                }}
                disabled={deleteDisabled}
              >
                Delete upload
              </Button>
              {deleteDisabledReason ? (
                <span className="text-xs text-gray-600">
                  {deleteDisabledReason}
                </span>
              ) : null}
            </div>

            {deleteConfirmOpen ? (
              <div
                className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"
                role="dialog"
                aria-modal="true"
                aria-label="Delete upload confirmation"
              >
                <div className="text-sm font-semibold text-amber-900">
                  Delete this upload?
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  <li>Playback will be revoked.</li>
                  <li>
                    Transcript content will be deleted or made unavailable.
                  </li>
                  <li>This action is irreversible for MVP.</li>
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deletingUpload}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      void onConfirmDelete();
                    }}
                    loading={deletingUpload}
                    disabled={deletingUpload}
                  >
                    Delete upload
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {uploading ? (
          <div
            className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
            role="status"
            aria-live="polite"
          >
            <div className="font-medium">Uploading video...</div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded bg-blue-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={state.uploadProgressPct}
            >
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${String(state.uploadProgressPct)}%` }}
              />
            </div>
            <div className="mt-1 text-xs">
              {String(state.uploadProgressPct)}% uploaded
            </div>
          </div>
        ) : null}

        {hasPreview ? (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">Preview</div>
            <video
              className="mt-3 max-h-96 w-full rounded bg-black"
              controls
              src={state.previewUrl ?? undefined}
            />
          </div>
        ) : null}

        {showProcessing ? (
          <div
            className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
            role="status"
            aria-live="polite"
          >
            Transcript processing...
            {state.transcriptProgressPct !== null ? (
              <span className="ml-1">
                ({String(state.transcriptProgressPct)}%)
              </span>
            ) : null}
          </div>
        ) : null}

        {showTranscript ? (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">
              Transcript
            </div>
            <div className="mt-3 max-h-72 space-y-4 overflow-auto rounded border border-gray-100 bg-gray-50 p-3">
              {hasTranscriptText ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Full transcript
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {state.transcriptText}
                  </p>
                </div>
              ) : null}

              {hasTranscriptSegments ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Timestamped segments
                  </div>
                  <ul className="mt-2 space-y-2">
                    {transcriptSegments.map((segment, index) => (
                      <li
                        key={`${segment.id ?? 'segment'}-${String(segment.startMs)}-${String(index)}`}
                        className="rounded border border-gray-200 bg-white p-2"
                      >
                        <div className="text-xs font-medium text-gray-500">
                          {formatSegmentRange(segment)}
                        </div>
                        <div className="mt-1 text-sm text-gray-800">
                          {segment.text}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!hasTranscriptText && !hasTranscriptSegments ? (
                <div className="text-sm text-gray-600">
                  Transcript is marked ready, but text and timestamped segments
                  are not available yet. Refresh and retry shortly.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </TaskContainer>
  );
}
