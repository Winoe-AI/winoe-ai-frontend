import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  getCandidateTaskDraft,
  type CandidateTaskDraft,
  type CandidateTaskDraftPayload,
} from '@/features/candidate/session/api/taskDraftsApi';
import { normalizeApiError } from '@/platform/errors/errors';
import {
  normalizePayload,
  payloadFingerprint,
} from './useTaskDraftAutosavePayload';

type RestoreStatus = 'idle' | 'restoring' | 'saving' | 'saved' | 'error';

type UseTaskDraftAutosaveRestoreArgs<TValue> = {
  taskId: number;
  candidateSessionId: number | null;
  hasFinalizedContent: boolean;
  setInternalStatus: Dispatch<SetStateAction<RestoreStatus>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLastSavedAt: Dispatch<SetStateAction<number | null>>;
  setRestoreApplied: Dispatch<SetStateAction<boolean>>;
  restoreKey: string;
  setRestoreReadyKey: Dispatch<SetStateAction<string | null>>;
  deserializeRef: MutableRefObject<
    (draft: CandidateTaskDraft) => TValue | null
  >;
  onRestoreRef: MutableRefObject<(value: TValue) => void>;
  onSavedAtRef: MutableRefObject<((savedAtMs: number) => void) | undefined>;
  serializeRef: MutableRefObject<(value: TValue) => CandidateTaskDraftPayload>;
  valueRef: MutableRefObject<TValue>;
  lastSavedFingerprintRef: MutableRefObject<string | null>;
};

export function useTaskDraftAutosaveRestore<TValue>({
  taskId,
  candidateSessionId,
  hasFinalizedContent,
  setInternalStatus,
  setError,
  setLastSavedAt,
  setRestoreApplied,
  restoreKey,
  setRestoreReadyKey,
  deserializeRef,
  onRestoreRef,
  onSavedAtRef,
  serializeRef,
  valueRef,
  lastSavedFingerprintRef,
}: UseTaskDraftAutosaveRestoreArgs<TValue>) {
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
          lastSavedFingerprintRef.current = payloadFingerprint(
            normalizePayload(serializeRef.current(valueRef.current)),
          );
          setInternalStatus('idle');
          setRestoreReadyKey(restoreKey);
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
        setRestoreReadyKey(restoreKey);
      } catch (err) {
        if (cancelled) return;
        setError(
          normalizeApiError(err, 'Unable to restore your draft.').message,
        );
        setInternalStatus('error');
        setRestoreReadyKey(restoreKey);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    candidateSessionId,
    deserializeRef,
    hasFinalizedContent,
    lastSavedFingerprintRef,
    onRestoreRef,
    onSavedAtRef,
    restoreKey,
    serializeRef,
    setError,
    setInternalStatus,
    setLastSavedAt,
    setRestoreApplied,
    setRestoreReadyKey,
    taskId,
    valueRef,
  ]);
}
