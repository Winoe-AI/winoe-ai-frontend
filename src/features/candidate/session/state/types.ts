import type { Dispatch, Reducer } from 'react';
import type {
  CandidateRecordedSubmission,
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/api';

export type SimulationSummary = { title: string; role: string };

export type CandidateBootstrap = {
  candidateSessionId: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  simulation: SimulationSummary;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[];
  scheduleLockedAt?: string | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export type TaskType =
  | 'design'
  | 'code'
  | 'debug'
  | 'handoff'
  | 'documentation'
  | string;

export type CandidateTask = {
  id: number;
  dayIndex: number;
  type: TaskType;
  title: string;
  description: string;
  recordedSubmission?: CandidateRecordedSubmission | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
};

export type TaskState = {
  loading: boolean;
  error: string | null;
  isComplete: boolean;
  completedTaskIds: number[];
  currentTask: CandidateTask | null;
};

export type CandidateSessionState = {
  inviteToken: string | null;
  candidateSessionId: number | null;
  bootstrap: CandidateBootstrap | null;
  started: boolean;
  taskState: TaskState;
  authStatus: 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';
  authError: string | null;
};

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
    completedTaskIds: number[];
    currentTask: CandidateTask | null;
  };
};

export type ReducerPair = {
  state: CandidateSessionState;
  dispatch: Dispatch<Action>;
  reducer: Reducer<CandidateSessionState, Action>;
};
