import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  getTaskDraftErrorCode,
  putCandidateTaskDraft,
  type CandidateTaskDraftPayload } from '@/features/candidate/api/taskDrafts';
import { normalizeApiError } from '@/lib/errors/errors';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage } from '../../lib/windowState';
import { normalizePayload, payloadFingerprint } from './taskDraftAutosavePayload';

type PersistStatus = 'idle' | 'restoring' | 'saving' | 'saved' | 'error';
type PersistReason = 'debounce' | 'hidden' | 'beforeunload' | 'manual';

type CreateTaskDraftPersistNowArgs<TValue> = {
  taskId: number;
  candidateSessionId: number | null;
  isDisabled: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
  setInternalStatus: Dispatch<SetStateAction<PersistStatus>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setAutosaveLocked: Dispatch<SetStateAction<boolean>>;
  setLastSavedAt: Dispatch<SetStateAction<number | null>>;
  serializeRef: MutableRefObject<(value: TValue) => CandidateTaskDraftPayload>;
  valueRef: MutableRefObject<TValue>;
  onSavedAtRef: MutableRefObject<((savedAtMs: number) => void) | undefined>;
  inFlightRef: MutableRefObject<Promise<boolean> | null>;
  lastSavedFingerprintRef: MutableRefObject<string | null>;
};

export function createTaskDraftPersistNow<TValue>({
  taskId,
  candidateSessionId,
  isDisabled,
  onTaskWindowClosed,
  setInternalStatus,
  setError,
  setAutosaveLocked,
  setLastSavedAt,
  serializeRef,
  valueRef,
  onSavedAtRef,
  inFlightRef,
  lastSavedFingerprintRef,
}: CreateTaskDraftPersistNowArgs<TValue>) {
  return async (_reason: PersistReason): Promise<boolean> => {
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
        const response = await putCandidateTaskDraft({ taskId, candidateSessionId, payload });
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
        if (getTaskDraftErrorCode(err) === 'DRAFT_FINALIZED') {
          setAutosaveLocked(true);
          setError('Draft finalized. This day is now read-only.');
          return false;
        }
        setError(normalizeApiError(err, 'Autosave failed. Keep editing and we will retry.').message);
        setInternalStatus('error');
        return false;
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  };
}
