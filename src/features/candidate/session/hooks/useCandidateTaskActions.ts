import { useMemo } from 'react';
import { useTaskLoader } from './useTaskLoader';
import { useTaskSubmission } from './useTaskSubmission';
import type { SessionCtx } from './useCandidateSessionActions.types';
import { STORAGE_KEY } from '../state/state';
import type { CandidateBootstrap } from '../state/types';

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
    session,
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
    onCompletionRecorded: (completedAt) => {
      const bootstrap = session.state.bootstrap;
      if (!bootstrap) return;
      session.setTaskLoaded({
        isComplete: true,
        completedAt: completedAt ?? null,
        completedTaskIds: session.state.taskState.completedTaskIds,
        currentTask: null,
      });
      const nextBootstrap: CandidateBootstrap = {
        ...bootstrap,
        status: 'completed',
        completedAt: completedAt ?? null,
      };
      session.setBootstrap(nextBootstrap);
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            bootstrap: nextBootstrap,
            taskState: {
              ...(parsed.taskState && typeof parsed.taskState === 'object'
                ? (parsed.taskState as Record<string, unknown>)
                : {}),
              isComplete: true,
              completedAt: completedAt ?? null,
            },
          }),
        );
      } catch {}
    },
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
