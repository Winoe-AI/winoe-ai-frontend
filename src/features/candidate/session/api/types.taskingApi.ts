import type { CandidateDayWindow } from './types.bootstrapApi';

export type CandidateRecordedSubmission = {
  submissionId: number;
  submittedAt: string;
  contentText?: string | null;
  contentJson?: Record<string, unknown> | null;
};

export type CandidateTask = {
  id: number;
  dayIndex: number;
  type: string;
  title: string;
  description: string;
  recordedSubmission?: CandidateRecordedSubmission | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
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
  commitSha?: string | null;
  checkpointSha?: string | null;
  finalSha?: string | null;
};

export type CandidateWorkspaceStatus = {
  repoName: string | null;
  repoFullName: string | null;
  codespaceUrl: string | null;
  codespaceState?: string | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
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
