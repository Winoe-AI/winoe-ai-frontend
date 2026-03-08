import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getCandidateTaskDraft,
  getTaskDraftErrorCode,
  putCandidateTaskDraft,
  type CandidateTaskDraft,
  type CandidateTaskDraftPayload,
} from '@/features/candidate/api';
import { normalizeApiError } from '@/lib/errors/errors';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../../lib/windowState';

export type TaskDraftAutosaveStatus =
  | 'idle'
  | 'restoring'
  | 'saving'
  | 'saved'
  | 'error'
  | 'disabled';

type UseTaskDraftAutosaveArgs<TValue> = {
  taskId: number;
  candidateSessionId: number | null;
  isEditable: boolean;
  hasFinalizedContent: boolean;
  value: TValue;
  serialize: (value: TValue) => CandidateTaskDraftPayload;
  deserialize: (draft: CandidateTaskDraft) => TValue | null;
  onRestore: (value: TValue) => void;
  onTaskWindowClosed?: (err: unknown) => void;
  onSavedAt?: (savedAtMs: number) => void;
  debounceMs?: number;
};

type UseTaskDraftAutosaveResult = {
  status: TaskDraftAutosaveStatus;
  lastSavedAt: number | null;
  restoreApplied: boolean;
  error: string | null;
  flushNow: () => Promise<boolean>;
};

function normalizePayload(
  payload: CandidateTaskDraftPayload,
): CandidateTaskDraftPayload {
  const normalized: CandidateTaskDraftPayload = {};
  if (payload.contentText !== undefined) {
    normalized.contentText =
      typeof payload.contentText === 'string' ? payload.contentText : null;
  }
  if (payload.contentJson !== undefined) {
    normalized.contentJson = payload.contentJson
      ? { ...payload.contentJson }
      : null;
  }
  return normalized;
}

function payloadFingerprint(payload: CandidateTaskDraftPayload): string {
  return JSON.stringify({
    contentText: payload.contentText ?? null,
    contentJson: payload.contentJson ?? null,
  });
}

export function useTaskDraftAutosave<TValue>({
  taskId,
  candidateSessionId,
  isEditable,
  hasFinalizedContent,
  value,
  serialize,
  deserialize,
  onRestore,
  onTaskWindowClosed,
  onSavedAt,
  debounceMs = 1500,
}: UseTaskDraftAutosaveArgs<TValue>): UseTaskDraftAutosaveResult {
  const [internalStatus, setInternalStatus] = useState<
    'idle' | 'restoring' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [restoreApplied, setRestoreApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autosaveLocked, setAutosaveLocked] = useState(false);

  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const onRestoreRef = useRef(onRestore);
  const onSavedAtRef = useRef(onSavedAt);
  const valueRef = useRef(value);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const lastSavedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);
  useEffect(() => {
    deserializeRef.current = deserialize;
  }, [deserialize]);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    onSavedAtRef.current = onSavedAt;
  }, [onSavedAt]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setInternalStatus('idle');
    setLastSavedAt(null);
    setRestoreApplied(false);
    setError(null);
    setAutosaveLocked(false);
    lastSavedFingerprintRef.current = null;
  }, [taskId, candidateSessionId]);

  const isDisabled = !isEditable || hasFinalizedContent || autosaveLocked;
  const status: TaskDraftAutosaveStatus = useMemo(
    () => (isDisabled ? 'disabled' : internalStatus),
    [internalStatus, isDisabled],
  );

  const persistNow = useCallback(
    async (_reason: 'debounce' | 'hidden' | 'beforeunload' | 'manual') => {
      if (candidateSessionId === null || !taskId || isDisabled) return false;
      if (inFlightRef.current) return inFlightRef.current;

      let payload: CandidateTaskDraftPayload;
      try {
        payload = normalizePayload(serializeRef.current(valueRef.current));
      } catch {
        if (!isDisabled) {
          setInternalStatus('error');
          setError('Unable to prepare your draft for autosave.');
        }
        return false;
      }

      const fingerprint = payloadFingerprint(payload);
      if (fingerprint === lastSavedFingerprintRef.current) return true;

      const run = (async () => {
        setInternalStatus('saving');
        setError(null);
        try {
          const response = await putCandidateTaskDraft({
            taskId,
            candidateSessionId,
            payload,
          });
          const savedAtMs = Date.parse(response.updatedAt);
          if (Number.isFinite(savedAtMs)) {
            setLastSavedAt(savedAtMs);
            onSavedAtRef.current?.(savedAtMs);
          }
          lastSavedFingerprintRef.current = fingerprint;
          setInternalStatus('saved');
          return true;
        } catch (err) {
          const windowClosed = extractTaskWindowClosedOverride(err);
          if (windowClosed) {
            setAutosaveLocked(true);
            setError(formatComeBackMessage(windowClosed));
            onTaskWindowClosed?.(err);
            return false;
          }

          const errorCode = getTaskDraftErrorCode(err);
          if (errorCode === 'DRAFT_FINALIZED') {
            setAutosaveLocked(true);
            setError('Draft finalized. This day is now read-only.');
            return false;
          }

          const normalized = normalizeApiError(
            err,
            'Autosave failed. Keep editing and we will retry.',
          );
          setError(normalized.message);
          setInternalStatus('error');
          return false;
        } finally {
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = run;
      return run;
    },
    [candidateSessionId, isDisabled, onTaskWindowClosed, taskId],
  );

  useEffect(() => {
    if (candidateSessionId === null || !taskId || hasFinalizedContent) return;
    let cancelled = false;

    setInternalStatus('restoring');
    setError(null);

    (async () => {
      try {
        const draft = await getCandidateTaskDraft({
          taskId,
          candidateSessionId,
        });
        if (cancelled) return;
        if (!draft) {
          setInternalStatus('idle');
          return;
        }

        lastSavedFingerprintRef.current = payloadFingerprint({
          contentText: draft.contentText ?? null,
          contentJson: draft.contentJson ?? null,
        });
        const savedAtMs = Date.parse(draft.updatedAt);
        if (Number.isFinite(savedAtMs)) {
          setLastSavedAt(savedAtMs);
          onSavedAtRef.current?.(savedAtMs);
        }

        const restored = deserializeRef.current(draft);
        if (restored !== null) {
          onRestoreRef.current(restored);
          setRestoreApplied(true);
        }
        setInternalStatus('saved');
      } catch (err) {
        if (cancelled) return;
        const normalized = normalizeApiError(
          err,
          'Unable to restore your draft.',
        );
        setError(normalized.message);
        setInternalStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateSessionId, hasFinalizedContent, taskId]);

  useEffect(() => {
    if (candidateSessionId === null || !taskId || isDisabled) return;

    let payload: CandidateTaskDraftPayload;
    try {
      payload = normalizePayload(serializeRef.current(valueRef.current));
    } catch {
      setInternalStatus('error');
      setError('Unable to prepare your draft for autosave.');
      return;
    }

    const fingerprint = payloadFingerprint(payload);
    if (fingerprint === lastSavedFingerprintRef.current) return;

    const timer = window.setTimeout(() => {
      void persistNow('debounce');
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [candidateSessionId, debounceMs, isDisabled, persistNow, taskId, value]);

  useEffect(() => {
    if (candidateSessionId === null || !taskId || isDisabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void persistNow('hidden');
      }
    };
    const handleBeforeUnload = () => {
      void persistNow('beforeunload');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [candidateSessionId, isDisabled, persistNow, taskId]);

  return {
    status,
    lastSavedAt,
    restoreApplied,
    error,
    flushNow: () => persistNow('manual'),
  };
}
