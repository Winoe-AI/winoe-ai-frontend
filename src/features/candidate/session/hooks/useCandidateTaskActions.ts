import { useMemo } from 'react';
import { useTaskLoader } from './useTaskLoader';
import { useTaskSubmission } from './useTaskSubmission';
import type { SessionCtx } from './useCandidateSessionActions.types';

type Params = {
  session: SessionCtx;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
  onTaskWindowClosed: (err: unknown) => void;
  onSubmissionRecorded: (payload: {
    submissionId: number;
    submittedAt: string;
  }) => void;
};

export function useCandidateTaskActions({
  session,
  markStart,
  markEnd,
  onTaskWindowClosed,
  onSubmissionRecorded,
}: Params) {
  const { fetchCurrentTask } = useTaskLoader({
    candidateSessionId: session.state.candidateSessionId,
    clearTaskError: session.clearTaskError,
    setTaskLoading: session.setTaskLoading,
    setTaskLoaded: session.setTaskLoaded,
    setTaskError: session.setTaskError,
    markStart,
    markEnd,
  });

  const { submitting, handleSubmit } = useTaskSubmission({
    candidateSessionId: session.state.candidateSessionId,
    currentTask: session.state.taskState.currentTask,
    clearTaskError: session.clearTaskError,
    setTaskError: session.setTaskError,
    refreshTask: (opts) => fetchCurrentTask(undefined, opts),
    onTaskWindowClosed,
    onSubmissionRecorded,
  });

  return useMemo(
    () => ({
      fetchCurrentTask,
      submitting,
      handleSubmit,
    }),
    [fetchCurrentTask, handleSubmit, submitting],
  );
}
