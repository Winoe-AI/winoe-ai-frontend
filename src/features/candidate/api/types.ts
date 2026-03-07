export type SimulationSummary = { title: string; role: string };

export type CandidateDayWindow = {
  dayIndex: number;
  windowStartAt: string;
  windowEndAt: string;
};

export type CandidateCurrentDayWindow = CandidateDayWindow & {
  state: 'upcoming' | 'active' | 'closed';
};

export type CandidateSessionBootstrapResponse = {
  candidateSessionId: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  simulation: SimulationSummary;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[];
  scheduleLockedAt?: string | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export type CandidateInvite = {
  candidateSessionId: number;
  token: string | null;
  title: string;
  role: string;
  company: string | null;
  status: CandidateSessionBootstrapResponse['status'] | string;
  progress: { completed: number; total: number } | null;
  expiresAt: string | null;
  lastActivityAt: string | null;
  isExpired: boolean;
};

export type CandidateRecordedSubmission = {
  submissionId: number;
  submittedAt: string;
};

export type CandidateTask = {
  id: number;
  dayIndex: number;
  type: string;
  title: string;
  description: string;
  recordedSubmission?: CandidateRecordedSubmission | null;
};

export type CandidateCurrentTaskResponse = {
  isComplete: boolean;
  completedTaskIds?: number[];
  progress?: { completedTaskIds?: number[] };
  currentTask: CandidateTask | null;
};

export type CandidateTaskSubmitResponse = {
  submissionId: number;
  taskId: number;
  candidateSessionId: number;
  submittedAt: string;
  progress: { completed: number; total: number };
  isComplete: boolean;
};

export type CandidateWorkspaceStatus = {
  repoUrl: string | null;
  repoName: string | null;
  repoFullName: string | null;
  codespaceUrl: string | null;
};

export type CandidateTestRunStartResponse = { runId: string };

export type CandidateTestRunStatusResponse = {
  status: 'running' | 'passed' | 'failed' | 'timeout' | 'error';
  message?: string;
  passed: number | null;
  failed: number | null;
  total: number | null;
  stdout: string | null;
  stderr: string | null;
  workflowUrl: string | null;
  commitSha: string | null;
};

export type CandidateScheduleResponse = {
  candidateSessionId: number;
  scheduledStartAt: string;
  candidateTimezone: string;
  dayWindows: CandidateDayWindow[];
  scheduleLockedAt: string;
};
