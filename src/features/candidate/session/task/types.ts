export type TaskType =
  | 'design'
  | 'code'
  | 'debug'
  | 'handoff'
  | 'documentation'
  | string;

export type Task = {
  id: number;
  dayIndex: number;
  type: TaskType;
  title: string;
  description: string;
  recordedSubmission?: {
    submissionId: number;
    submittedAt: string;
    contentText?: string | null;
    contentJson?: Record<string, unknown> | null;
  } | null;
};

export type Day5ReflectionPayload = {
  challenges: string;
  decisions: string;
  tradeoffs: string;
  communication: string;
  next: string;
};

export type SubmitPayload = {
  contentText?: string;
  reflection?: Day5ReflectionPayload;
};

export type SubmitResponse = {
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
