import { useCallback } from 'react';
import type { CandidateBootstrap, CandidateSessionState } from './types';
import type { ReducerPair } from './types';

export function useSessionActions(dispatch: ReducerPair['dispatch']) {
  const setInviteToken = useCallback(
    (token: string) =>
      dispatch({ type: 'SET_INVITE_TOKEN', inviteToken: token }),
    [dispatch],
  );
  const setCandidateSessionId = useCallback(
    (candidateSessionId: number | null) =>
      dispatch({ type: 'SET_CANDIDATE_SESSION_ID', candidateSessionId }),
    [dispatch],
  );
  const setBootstrap = useCallback(
    (bootstrap: CandidateBootstrap) =>
      dispatch({ type: 'SET_BOOTSTRAP', bootstrap }),
    [dispatch],
  );
  const setStarted = useCallback(
    (started: boolean) => dispatch({ type: 'SET_STARTED', started }),
    [dispatch],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);

  const setTaskLoading = useCallback(
    () => dispatch({ type: 'TASK_LOADING' }),
    [dispatch],
  );
  const setTaskLoaded = useCallback(
    (payload: {
      isComplete: boolean;
      completedAt?: string | null;
      completedTaskIds: number[];
      currentTask: CandidateSessionState['taskState']['currentTask'];
    }) => dispatch({ type: 'TASK_LOADED', payload }),
    [dispatch],
  );
  const setTaskError = useCallback(
    (error: string) => dispatch({ type: 'TASK_ERROR', error }),
    [dispatch],
  );
  const clearTaskError = useCallback(
    () => dispatch({ type: 'TASK_CLEAR_ERROR' }),
    [dispatch],
  );

  return {
    setInviteToken,
    setCandidateSessionId,
    setBootstrap,
    setStarted,
    reset,
    setTaskLoading,
    setTaskLoaded,
    setTaskError,
    clearTaskError,
  };
}
