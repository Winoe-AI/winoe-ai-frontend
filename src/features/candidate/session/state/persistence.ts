import { useEffect } from 'react';
import type { CandidateSessionState, PersistedState } from './types';
import { STORAGE_KEY } from './state';
import type { ReducerPair } from './types';

const SESSION_PATH_PREFIX = '/candidate/session/';
const LEGACY_SESSION_PATH_PREFIX = '/candidate-sessions/';

function normalizePersistedTaskState(
  value: unknown,
): PersistedState['taskState'] | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const completedTaskIds = Array.isArray(record.completedTaskIds)
    ? record.completedTaskIds.filter(
        (taskId): taskId is number =>
          typeof taskId === 'number' && Number.isFinite(taskId),
      )
    : [];
  const currentTask =
    record.currentTask && typeof record.currentTask === 'object'
      ? (record.currentTask as PersistedState['taskState']['currentTask'])
      : null;
  return {
    isComplete: record.isComplete === true,
    completedTaskIds,
    currentTask,
  };
}

function normalizePersistedInviteToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function decodePathToken(rawToken: string): string | null {
  const trimmed = rawToken.trim();
  if (!trimmed) return null;
  try {
    const decoded = decodeURIComponent(trimmed).trim();
    return decoded ? decoded : null;
  } catch {
    return null;
  }
}

function routeTokenFromPathname(pathname: string): string | null {
  const prefixes = [SESSION_PATH_PREFIX, LEGACY_SESSION_PATH_PREFIX];
  for (const prefix of prefixes) {
    if (!pathname.startsWith(prefix)) continue;
    const rawToken = pathname.slice(prefix.length).split('/')[0] ?? '';
    return decodePathToken(rawToken);
  }
  return null;
}

function activeRouteToken(): string | null {
  if (typeof window === 'undefined') return null;
  return routeTokenFromPathname(window.location.pathname);
}

export function usePersistedState(
  state: CandidateSessionState,
  dispatch: ReducerPair['dispatch'],
) {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const persistedInviteToken = normalizePersistedInviteToken(
        parsed?.inviteToken,
      );
      const routeToken = activeRouteToken();
      const isRouteTokenMismatch =
        routeToken !== null && persistedInviteToken !== routeToken;

      if (isRouteTokenMismatch) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (persistedInviteToken) {
        dispatch({
          type: 'SET_INVITE_TOKEN',
          inviteToken: persistedInviteToken,
        });
      }
      if (typeof parsed?.candidateSessionId === 'number') {
        dispatch({
          type: 'SET_CANDIDATE_SESSION_ID',
          candidateSessionId: parsed.candidateSessionId,
        });
      }

      if (routeToken === null) return;

      if (parsed?.bootstrap) {
        dispatch({
          type: 'SET_BOOTSTRAP',
          bootstrap: parsed.bootstrap as NonNullable<
            PersistedState['bootstrap']
          >,
        });
      }
      if (typeof parsed?.started === 'boolean') {
        dispatch({ type: 'SET_STARTED', started: parsed.started });
      }
      const persistedTaskState = normalizePersistedTaskState(parsed?.taskState);
      if (persistedTaskState) {
        dispatch({
          type: 'TASK_LOADED',
          payload: persistedTaskState,
        });
      }
    } catch {}
  }, [dispatch]);

  useEffect(() => {
    try {
      const toPersist: PersistedState = {
        inviteToken: state.inviteToken,
        candidateSessionId: state.candidateSessionId,
        bootstrap: state.bootstrap,
        started: state.started,
        taskState: {
          isComplete: state.taskState.isComplete,
          completedTaskIds: state.taskState.completedTaskIds,
          currentTask: state.taskState.currentTask,
        },
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch {}
  }, [
    state.bootstrap,
    state.candidateSessionId,
    state.inviteToken,
    state.started,
    state.taskState.completedTaskIds,
    state.taskState.currentTask,
    state.taskState.isComplete,
  ]);
}
