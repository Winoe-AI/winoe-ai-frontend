import type { Dispatch, Reducer } from 'react';
import type {
  CandidateBootstrap,
  CandidateSessionState,
  CandidateTask,
} from './types.model';

export type Action =
  | { type: 'SET_INVITE_TOKEN'; inviteToken: string }
  | { type: 'SET_CANDIDATE_SESSION_ID'; candidateSessionId: number | null }
  | { type: 'SET_BOOTSTRAP'; bootstrap: CandidateBootstrap }
  | { type: 'SET_STARTED'; started: boolean }
  | { type: 'RESET' }
  | { type: 'TASK_LOADING' }
  | {
      type: 'TASK_LOADED';
      payload: {
        isComplete: boolean;
        completedAt?: string | null;
        completedTaskIds: number[];
        currentTask: CandidateTask | null;
      };
    }
  | { type: 'TASK_ERROR'; error: string }
  | { type: 'TASK_CLEAR_ERROR' }
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_READY' }
  | { type: 'AUTH_UNAUTHENTICATED' }
  | { type: 'AUTH_ERROR'; error: string };

export type Ctx = {
  state: CandidateSessionState;
  setInviteToken: (token: string) => void;
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateBootstrap) => void;
  setStarted: (started: boolean) => void;
  reset: () => void;
  setTaskLoading: () => void;
  setTaskLoaded: (p: {
    isComplete: boolean;
    completedAt?: string | null;
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  }) => void;
  setTaskError: (error: string) => void;
  clearTaskError: () => void;
};

export type PersistedState = {
  inviteToken: string | null;
  candidateSessionId: number | null;
  bootstrap: CandidateBootstrap | null;
  started: boolean;
  taskState: {
    isComplete: boolean;
    completedAt?: string | null;
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  };
};

export type ReducerPair = {
  state: CandidateSessionState;
  dispatch: Dispatch<Action>;
  reducer: Reducer<CandidateSessionState, Action>;
};
