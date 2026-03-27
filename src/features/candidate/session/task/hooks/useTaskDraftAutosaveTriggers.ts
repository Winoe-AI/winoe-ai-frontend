import { useEffect } from 'react';

type UseTaskDraftAutosaveTriggersArgs<TValue> = {
  taskId: number;
  candidateSessionId: number | null;
  isDisabled: boolean;
  debounceMs: number;
  value: TValue;
  persistNow: (
    reason: 'debounce' | 'hidden' | 'beforeunload' | 'manual',
  ) => Promise<boolean>;
};

export function useTaskDraftAutosaveTriggers<TValue>({
  taskId,
  candidateSessionId,
  isDisabled,
  debounceMs,
  value,
  persistNow,
}: UseTaskDraftAutosaveTriggersArgs<TValue>) {
  useEffect(() => {
    if (candidateSessionId === null || !taskId || isDisabled) return;
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
      if (document.visibilityState === 'hidden') void persistNow('hidden');
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
}
