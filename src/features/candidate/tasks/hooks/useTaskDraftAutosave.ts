import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CandidateTaskDraft,
  CandidateTaskDraftPayload,
} from '@/features/candidate/session/api/taskDraftsApi';
import { createTaskDraftPersistNow } from './useTaskDraftAutosavePersist';
import { useTaskDraftAutosaveRestore } from './useTaskDraftAutosaveRestore';
import { useTaskDraftAutosaveTriggers } from './useTaskDraftAutosaveTriggers';

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
}: UseTaskDraftAutosaveArgs<TValue>) {
  const [internalStatus, setInternalStatus] = useState<
    'idle' | 'restoring' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [restoreApplied, setRestoreApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autosaveLocked, setAutosaveLocked] = useState(false);
  const [restoreReadyKey, setRestoreReadyKey] = useState<string | null>(null);
  const restoreKey = `${candidateSessionId ?? 'none'}:${taskId}`;
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const onRestoreRef = useRef(onRestore);
  const onSavedAtRef = useRef(onSavedAt);
  const valueRef = useRef(value);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const lastSavedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    serializeRef.current = serialize;
    deserializeRef.current = deserialize;
    onRestoreRef.current = onRestore;
    onSavedAtRef.current = onSavedAt;
    valueRef.current = value;
  }, [deserialize, onRestore, onSavedAt, serialize, value]);
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setInternalStatus('idle');
      setLastSavedAt(null);
      setRestoreApplied(false);
      setError(null);
      setAutosaveLocked(false);
      lastSavedFingerprintRef.current = null;
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [taskId, candidateSessionId]);

  const isDisabled =
    !isEditable ||
    hasFinalizedContent ||
    autosaveLocked ||
    restoreReadyKey !== restoreKey;
  const status: TaskDraftAutosaveStatus = useMemo(
    () => (isDisabled ? 'disabled' : internalStatus),
    [internalStatus, isDisabled],
  );
  const persistNow = useCallback(
    (
      reason: Parameters<
        ReturnType<typeof createTaskDraftPersistNow<TValue>>
      >[0],
    ) =>
      createTaskDraftPersistNow({
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
      })(reason),
    [candidateSessionId, isDisabled, onTaskWindowClosed, taskId],
  );

  useTaskDraftAutosaveRestore({
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
  });
  useTaskDraftAutosaveTriggers({
    taskId,
    candidateSessionId,
    isDisabled,
    debounceMs,
    value,
    persistNow,
  });

  return {
    status,
    lastSavedAt,
    restoreApplied,
    error,
    flushNow: useCallback(() => persistNow('manual'), [persistNow]),
  };
}
