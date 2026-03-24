import { useCallback, useRef } from 'react';
import { getCandidateCurrentTask } from '@/features/candidate/api/tasks';
import { friendlyTaskError } from '../utils/errorMessages';
import type { CandidateTask } from '../CandidateSessionProvider';

type Params = {
  candidateSessionId: number | null;
  setTaskLoading: () => void;
  setTaskLoaded: (task: {
    isComplete: boolean;
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  }) => void;
  setTaskError: (message: string | null) => void;
  clearTaskError: () => void;
};

export function useCurrentTask(params: Params) {
  const inflight = useRef<{
    key: string | null;
    promise: Promise<void> | null;
  }>({ key: null, promise: null });

  const fetchCurrentTask = useCallback(async () => {
    if (!params.candidateSessionId) return;
    const sessionId = params.candidateSessionId;
    const key = `${sessionId}`;
    if (inflight.current.promise && inflight.current.key === key) {
      return inflight.current.promise;
    }

    params.setTaskLoading();
    params.clearTaskError();

    const exec = (async () => {
      try {
        const result = await getCandidateCurrentTask(sessionId);
        if (result) {
          params.setTaskLoaded({
            isComplete: Boolean(result.isComplete),
            completedTaskIds:
              result.progress?.completedTaskIds ??
              result.completedTaskIds ??
              [],
            currentTask: result.currentTask ?? null,
          });
        } else {
          params.setTaskLoaded({
            isComplete: false,
            completedTaskIds: [],
            currentTask: null,
          });
        }
      } catch (e) {
        params.setTaskError(friendlyTaskError(e));
      } finally {
        inflight.current = { key: null, promise: null };
      }
    })();

    inflight.current = { key, promise: exec };
    return exec;
  }, [params]);

  return { fetchCurrentTask };
}
