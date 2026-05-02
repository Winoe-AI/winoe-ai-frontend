import { useCallback, useRef } from 'react';
import {
  getCandidateCurrentTask,
  type CandidateCurrentDayWindow,
} from '@/features/candidate/session/api';
import {
  normalizeCompletedTaskIds,
  toTask,
} from '../utils/taskTransformsUtils';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { SessionCtx } from './useCandidateSessionActions.types';

function toCurrentDayWindow(
  dayIndex: number | null | undefined,
  currentWindow:
    | {
        windowStartAt?: string | null;
        windowEndAt?: string | null;
        nextOpenAt?: string | null;
        isOpen?: boolean | null;
        now?: string | null;
      }
    | null
    | undefined,
): CandidateCurrentDayWindow | null {
  if (!dayIndex || !currentWindow) return null;
  const windowStartAt = currentWindow.windowStartAt ?? null;
  const windowEndAt = currentWindow.windowEndAt ?? null;
  if (!windowStartAt || !windowEndAt) return null;
  const state = currentWindow.isOpen
    ? 'active'
    : currentWindow.nextOpenAt
      ? 'upcoming'
      : 'closed';
  return {
    dayIndex,
    windowStartAt,
    windowEndAt,
    state,
  };
}

type TaskLoaderDeps = {
  session: SessionCtx;
  candidateSessionId: number | null;
  clearTaskError: () => void;
  setTaskLoading: () => void;
  setTaskLoaded: (payload: {
    isComplete: boolean;
    completedAt: string | null;
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  }) => void;
  setTaskError: (msg: string) => void;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};

export function useTaskLoader({
  session,
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
          completedAt: dto.completedAt ?? null,
          completedTaskIds: normalizeCompletedTaskIds(dto),
          currentTask: toTask(dto.currentTask, dto.currentWindow),
        });
        const bootstrap = session.state.bootstrap;
        const currentDayWindow = toCurrentDayWindow(
          dto.currentTask?.dayIndex,
          dto.currentWindow,
        );
        if (bootstrap) {
          session.setBootstrap({
            ...bootstrap,
            completedAt: dto.completedAt ?? bootstrap.completedAt ?? null,
            ...(currentDayWindow ? { currentDayWindow } : {}),
          });
        }
        markEnd('candidate:task:fetch', { sessionId, result: 'success' });
        return dto;
      } catch (err) {
        setTaskError((err as { message?: string }).message ?? 'Unable to load');
        markEnd('candidate:task:fetch', { sessionId, result: 'error' });
        throw err;
      } finally {
        taskInFlightRef.current = false;
      }
    },
    [
      session,
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
