export type SubmissionListItem = {
  submissionId: number;
  candidateSessionId: number;
  taskId: number;
  dayIndex: number;
  type: string;
  submittedAt: string;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  repoUrl?: string | null;
  repoFullName?: string | null;
  workflowUrl?: string | null;
  commitUrl?: string | null;
  diffUrl?: string | null;
  diffSummary?: Record<string, unknown> | null;
  testResults?: SubmissionTestResults | null;
};

export type SubmissionListResponse = { items: SubmissionListItem[] };

export type SubmissionTestResults = {
  passed: number | null;
  failed: number | null;
  total: number | null;
  stdout: string | null;
  stderr: string | null;
  stdoutTruncated?: boolean | null;
  stderrTruncated?: boolean | null;
  runId?: string | null;
  workflowRunId?: string | null;
  runStatus?: string | null;
  conclusion?: string | null;
  timeout?: boolean | null;
  summary?: unknown;
  commitUrl?: string | null;
  workflowUrl?: string | null;
  artifactName?: string | null;
  artifactPresent?: boolean | null;
  artifactErrorCode?: string | null;
  output?: unknown;
};

export type HandoffTranscriptSegment = {
  id?: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

export type HandoffTranscript = {
  status: string;
  text: string | null;
  segments: HandoffTranscriptSegment[];
};

export type HandoffSubmissionArtifact = {
  recordingId: string | null;
  downloadUrl: string | null;
  recordingStatus?: string | null;
  isDeleted?: boolean | null;
  deletedAt?: string | null;
  transcript: HandoffTranscript | null;
};

export type SubmissionArtifact = {
  submissionId: number;
  candidateSessionId: number;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  task: {
    taskId: number;
    dayIndex: number;
    type: string;
    title: string;
    prompt: string | null;
  };
  contentText: string | null;
  code?: {
    blob?: string | null;
    repoPath?: string | null;
    repoFullName?: string | null;
    repoUrl?: string | null;
  } | null;
  repoUrl?: string | null;
  repoFullName?: string | null;
  workflowUrl?: string | null;
  commitUrl?: string | null;
  diffUrl?: string | null;
  diffSummary?: Record<string, unknown> | null;
  testResults: SubmissionTestResults | null;
  handoff?: HandoffSubmissionArtifact | null;
  submittedAt: string;
};
