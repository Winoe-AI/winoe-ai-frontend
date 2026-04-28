import { useCallback, useRef } from 'react';
import { getCandidateCurrentTask } from '@/features/candidate/session/api/tasksApi';
import {
  normalizeCompletedTaskIds,
  toTask,
} from '../utils/taskTransformsUtils';
import type { CandidateTask } from '../CandidateSessionProvider';

type TaskLoaderDeps = {
  candidateSessionId: number | null;
  clearTaskError: () => void;
  setTaskLoading: () => void;
  setTaskLoaded: (payload: {
    isComplete: boolean;
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  }) => void;
  setTaskError: (msg: string) => void;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};

export function useTaskLoader({
  candidateSessionId,
  clearTaskError,
  setTaskLoading,
  setTaskLoaded,
  setTaskError,
  markStart,
  markEnd,
}: TaskLoaderDeps) {
  const taskInFlightRef = useRef(false);

  const fetchCurrentTask = useCallback(
    async (
      overrides?: { sessionId?: number },
      options?: { skipCache?: boolean },
    ) => {
      const sessionId = overrides?.sessionId ?? candidateSessionId;
      if (!sessionId) return;
      if (taskInFlightRef.current) return;

      taskInFlightRef.current = true;
      markStart('candidate:task:fetch');
      clearTaskError();
      setTaskLoading();

      try {
        const dto = options
          ? await getCandidateCurrentTask(sessionId, options)
          : await getCandidateCurrentTask(sessionId);
        if (!dto) throw new Error('Unable to load current task.');
        setTaskLoaded({
          isComplete: Boolean(dto.isComplete),
          completedTaskIds: normalizeCompletedTaskIds(dto),
          currentTask: toTask(dto.currentTask, dto.currentWindow),
        });
        markEnd('candidate:task:fetch', { sessionId, result: 'success' });
      } catch (err) {
        setTaskError((err as { message?: string }).message ?? 'Unable to load');
        markEnd('candidate:task:fetch', { sessionId, result: 'error' });
        throw err;
      } finally {
        taskInFlightRef.current = false;
      }
    },
    [
      candidateSessionId,
      clearTaskError,
      markEnd,
      markStart,
      setTaskError,
      setTaskLoaded,
      setTaskLoading,
    ],
  );

  return { fetchCurrentTask };
}
