export type CandidateTaskMock = {
  id: number;
  dayIndex: number;
  type: string;
  title: string;
  description: string;
  recordedSubmission?: {
    submissionId: number;
    submittedAt: string;
    contentText?: string | null;
    contentJson?: Record<string, unknown> | null;
  } | null;
};

export type PollStatusMock = {
  status: 'running' | 'passed' | 'failed' | 'timeout' | 'error';
  message?: string;
  passed?: number | null;
  failed?: number | null;
  total?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  workflowUrl?: string | null;
  commitSha?: string | null;
};

export type CandidateSessionMockOptions = {
  token?: string;
  candidateSessionId?: number;
  simulationTitle?: string;
  simulationRole?: string;
  initialTask: CandidateTaskMock | null;
  nextTaskAfterSubmit?: CandidateTaskMock | null;
  completedTaskIds?: number[];
  completedTaskIdsAfterSubmit?: number[];
  isCompleteInitially?: boolean;
  isCompleteAfterSubmit?: boolean;
  submitResponse?: Record<string, unknown>;
  workspaceStatus?: Record<string, unknown>;
  runStatusSequence?: PollStatusMock[];
  invites?: Array<Record<string, unknown>>;
};

export type CandidateSessionMockState = {
  token: string;
  candidateSessionId: number;
  submitCount: number;
  runPollCount: number;
};

export type Day4HandoffMockState = {
  completeBody: Record<string, unknown> | null;
  initBody: Record<string, unknown> | null;
};

export type CandidateInvitesMockOptions = {
  invites?: Array<Record<string, unknown>>;
  status?: number;
  message?: string;
  delayMs?: number;
};
