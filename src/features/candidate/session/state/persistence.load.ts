import { STORAGE_KEY } from './state';
import type { PersistedState, ReducerPair } from './types';
import { activeRouteToken } from './persistence.routeToken';

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

export function loadPersistedState(dispatch: ReducerPair['dispatch']) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const persistedInviteToken = normalizePersistedInviteToken(parsed?.inviteToken);
    const routeToken = activeRouteToken();
    const isRouteTokenMismatch =
      routeToken !== null && persistedInviteToken !== routeToken;

    if (isRouteTokenMismatch) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (persistedInviteToken) {
      dispatch({ type: 'SET_INVITE_TOKEN', inviteToken: persistedInviteToken });
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
        bootstrap: parsed.bootstrap as NonNullable<PersistedState['bootstrap']>,
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
}
