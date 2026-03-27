import { useMemo } from 'react';
import type { Ctx } from '../../state/types';

export function useCandidateSessionScopedState(session: Ctx, token: string) {
  const sessionTokenMismatch =
    session.state.inviteToken !== null && session.state.inviteToken !== token;

  const state = useMemo(
    () =>
      sessionTokenMismatch
        ? {
            ...session.state,
            candidateSessionId: null,
            bootstrap: null,
            started: false,
            taskState: {
              loading: false,
              error: null,
              isComplete: false,
              completedTaskIds: [],
              currentTask: null,
            },
          }
        : session.state,
    [session.state, sessionTokenMismatch],
  );

  const sessionForActions = useMemo(
    () => (sessionTokenMismatch ? { ...session, state } : session),
    [session, sessionTokenMismatch, state],
  );

  const candidateSessionId = state.candidateSessionId ?? null;
  const currentTask = state.taskState.currentTask;
  const currentTaskId = currentTask?.id ?? null;

  return {
    state,
    sessionForActions,
    candidateSessionId,
    currentTask,
    currentTaskId,
  };
}
