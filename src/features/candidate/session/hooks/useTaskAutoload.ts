import { useEffect } from 'react';
import type React from 'react';
import { friendlyTaskError } from '../utils/errorMessagesUtils';
import type { ViewState } from '../CandidateSessionView';
import type { CandidateSessionState } from '../CandidateSessionProvider';

type Params = {
  view: ViewState;
  state: CandidateSessionState;
  fetchCurrentTask: (
    overrides?: { sessionId?: number },
    options?: { skipCache?: boolean },
  ) => Promise<{ completedAt?: string | null } | void>;
  setErrorMessage: (m: string | null) => void;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
};

export function useTaskAutoload({
  view,
  state,
  fetchCurrentTask,
  setErrorMessage,
  setView,
}: Params) {
  const started = state.started || state.bootstrap?.status === 'in_progress';
  const bootstrapDayIndex = state.bootstrap?.currentDayWindow?.dayIndex ?? null;
  const currentTaskDayIndex = state.taskState.currentTask?.dayIndex ?? null;
  const hasCompletionTimestamp = Boolean(
    state.taskState.completedAt ?? state.bootstrap?.completedAt,
  );
  const shouldAutoloadCompletedSession =
    state.bootstrap?.status === 'completed' && !hasCompletionTimestamp;
  const shouldRefreshStaleTask =
    typeof bootstrapDayIndex === 'number' &&
    typeof currentTaskDayIndex === 'number' &&
    bootstrapDayIndex > currentTaskDayIndex;

  useEffect(() => {
    if (
      view === 'auth' ||
      view === 'error' ||
      view === 'accessDenied' ||
      view === 'expired' ||
      view === 'scheduling' ||
      view === 'scheduleConfirm' ||
      view === 'scheduleSubmitting' ||
      view === 'locked'
    )
      return;
    if (!state.candidateSessionId) return;
    if (!started && !shouldAutoloadCompletedSession) return;
    if (state.taskState.loading) return;
    if (state.taskState.isComplete) {
      if (hasCompletionTimestamp) return;
    } else if (state.taskState.currentTask && !shouldRefreshStaleTask) {
      return;
    }
    setView((prev) => (prev === 'loading' ? 'starting' : 'running'));
    void fetchCurrentTask().catch((err) => {
      setErrorMessage(friendlyTaskError(err));
      setView('error');
    });
  }, [
    fetchCurrentTask,
    setErrorMessage,
    setView,
    shouldRefreshStaleTask,
    hasCompletionTimestamp,
    shouldAutoloadCompletedSession,
    started,
    state,
    view,
  ]);
}
