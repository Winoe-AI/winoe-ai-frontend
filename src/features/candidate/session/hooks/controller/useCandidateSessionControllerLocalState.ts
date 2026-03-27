import { useCallback, useState } from 'react';
import type { ViewState } from '../../CandidateSessionView';
import {
  extractTaskWindowClosedOverride,
  type TaskWindowClosedOverride,
} from '../../lib/windowState';

export function useCandidateSessionControllerLocalState(
  currentTaskId: number | null,
) {
  const [view, setView] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [taskWindowOverride, setTaskWindowOverride] = useState<{
    taskId: number;
    value: TaskWindowClosedOverride;
  } | null>(null);

  const handleTaskWindowClosed = useCallback(
    (err: unknown) => {
      if (!currentTaskId) return;
      const override = extractTaskWindowClosedOverride(err);
      if (!override) return;
      setTaskWindowOverride({ taskId: currentTaskId, value: override });
    },
    [currentTaskId],
  );

  const resetLocalState = useCallback(() => {
    setErrorMessage(null);
    setErrorStatus(null);
    setAuthMessage(null);
    setView('loading');
    setTaskWindowOverride(null);
  }, []);

  return {
    view,
    setView,
    errorMessage,
    setErrorMessage,
    errorStatus,
    setErrorStatus,
    authMessage,
    setAuthMessage,
    taskWindowOverride,
    handleTaskWindowClosed,
    resetLocalState,
  };
}
