import { useMemo } from 'react';
import { useTestHandlers } from './useTestHandlers';
import type { SessionCtx } from './useCandidateSessionActions.types';

type Params = {
  session: SessionCtx;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function useCandidateTestActions({
  session,
  onTaskWindowClosed = () => {},
}: Params) {
  const { handleStartTests, handlePollTests } = useTestHandlers({
    candidateSessionId: session.state.candidateSessionId,
    currentTask: session.state.taskState.currentTask,
    onTaskWindowClosed,
  });

  return useMemo(
    () => ({
      handleStartTests,
      handlePollTests,
    }),
    [handlePollTests, handleStartTests],
  );
}
