import { BRAND_SLUG } from '@/platform/config/brand';
import type { Action, CandidateSessionState, TaskState } from './types';

export const STORAGE_KEY = `${BRAND_SLUG}:candidate_session_v1`;

const initialTaskState: TaskState = {
  loading: false,
  error: null,
  isComplete: false,
  completedAt: null,
  completedTaskIds: [],
  currentTask: null,
};

export const initialState: CandidateSessionState = {
  inviteToken: null,
  candidateSessionId: null,
  bootstrap: null,
  started: false,
  taskState: initialTaskState,
  authStatus: 'idle',
  authError: null,
};

export function reducer(
  state: CandidateSessionState,
  action: Action,
): CandidateSessionState {
  switch (action.type) {
    case 'SET_INVITE_TOKEN':
      if (state.inviteToken === action.inviteToken) return state;
      return { ...state, inviteToken: action.inviteToken };
    case 'SET_CANDIDATE_SESSION_ID':
      if (state.candidateSessionId === action.candidateSessionId) return state;
      return { ...state, candidateSessionId: action.candidateSessionId };
    case 'SET_BOOTSTRAP':
      if (state.bootstrap === action.bootstrap) return state;
      return { ...state, bootstrap: action.bootstrap };
    case 'SET_STARTED':
      return { ...state, started: action.started };
    case 'TASK_LOADING':
      return {
        ...state,
        taskState: { ...state.taskState, loading: true, error: null },
      };
    case 'TASK_LOADED':
      return {
        ...state,
        taskState: {
          loading: false,
          error: null,
          isComplete: action.payload.isComplete,
          completedAt: action.payload.completedAt ?? null,
          completedTaskIds: action.payload.completedTaskIds,
          currentTask: action.payload.currentTask,
        },
      };
    case 'TASK_ERROR':
      return {
        ...state,
        taskState: { ...state.taskState, loading: false, error: action.error },
      };
    case 'TASK_CLEAR_ERROR':
      return { ...state, taskState: { ...state.taskState, error: null } };
    case 'AUTH_LOADING':
      return { ...state, authStatus: 'loading', authError: null };
    case 'AUTH_READY':
      return { ...state, authStatus: 'ready', authError: null };
    case 'AUTH_UNAUTHENTICATED':
      return {
        ...state,
        authStatus: 'unauthenticated',
        authError: null,
      };
    case 'AUTH_ERROR':
      return { ...state, authStatus: 'error', authError: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
