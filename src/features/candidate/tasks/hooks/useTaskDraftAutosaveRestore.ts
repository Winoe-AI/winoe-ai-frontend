import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  getCandidateTaskDraft,
  type CandidateTaskDraft,
} from '@/features/candidate/session/api/taskDraftsApi';
import { normalizeApiError } from '@/platform/errors/errors';
import { payloadFingerprint } from './useTaskDraftAutosavePayload';

type RestoreStatus = 'idle' | 'restoring' | 'saving' | 'saved' | 'error';

type UseTaskDraftAutosaveRestoreArgs<TValue> = {
  taskId: number;
  candidateSessionId: number | null;
  hasFinalizedContent: boolean;
  setInternalStatus: Dispatch<SetStateAction<RestoreStatus>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLastSavedAt: Dispatch<SetStateAction<number | null>>;
  setRestoreApplied: Dispatch<SetStateAction<boolean>>;
  deserializeRef: MutableRefObject<
    (draft: CandidateTaskDraft) => TValue | null
  >;
  onRestoreRef: MutableRefObject<(value: TValue) => void>;
  onSavedAtRef: MutableRefObject<((savedAtMs: number) => void) | undefined>;
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
  deserializeRef,
  onRestoreRef,
  onSavedAtRef,
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
        setError(
          normalizeApiError(err, 'Unable to restore your draft.').message,
        );
        setInternalStatus('error');
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
    setError,
    setInternalStatus,
    setLastSavedAt,
    setRestoreApplied,
    taskId,
  ]);
}
