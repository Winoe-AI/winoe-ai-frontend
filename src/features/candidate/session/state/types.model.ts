import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
  CandidateRecordedSubmission,
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
