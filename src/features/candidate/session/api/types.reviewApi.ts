import type {
  CandidateDayWindow,
  CandidateSessionBootstrapResponse,
  TrialSummary,
} from './types.bootstrapApi';

export type CandidateReviewTestResults = {
  status?: string | null;
  passed?: number | null;
  failed?: number | null;
  total?: number | null;
  runId?: number | string | null;
  runStatus?: string | null;
  conclusion?: string | null;
  timeout?: boolean | null;
  stdout?: string | null;
  stderr?: string | null;
  summary?: Record<string, unknown> | null;
  stdoutTruncated?: boolean | null;
  stderrTruncated?: boolean | null;
  artifactName?: string | null;
  artifactPresent?: boolean | null;
  artifactErrorCode?: string | null;
  output?: Record<string, unknown> | string | null;
  lastRunAt?: string | null;
  workflowRunId?: string | null;
  commitSha?: string | null;
  workflowUrl?: string | null;
  commitUrl?: string | null;
} | null;

export type CandidateReviewRecordingAsset = {
  recordingId: string;
  contentType: string;
  bytes: number;
  status: string;
  createdAt: string;
  downloadUrl?: string | null;
} | null;

export type CandidateReviewTranscriptSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type CandidateReviewTranscript = {
  status: string;
  modelName?: string | null;
  text?: string | null;
  segmentsJson?: CandidateReviewTranscriptSegment[] | null;
  segments?: CandidateReviewTranscriptSegment[] | null;
} | null;

export type CandidateReviewCommitHistoryEntry = {
  sha?: string | null;
  commitSha?: string | null;
  message?: string | null;
  summary?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  committedAt?: string | null;
  url?: string | null;
  commitUrl?: string | null;
  workflowUrl?: string | null;
} | null;

type CandidateReviewArtifactBase = {
  dayIndex: number;
  taskId: number;
  taskType: string;
  title: string;
  submittedAt: string;
};

export type CandidateReviewMarkdownArtifact = CandidateReviewArtifactBase & {
  kind: 'markdown';
  markdown?: string | null;
  contentJson?: Record<string, unknown> | null;
};

export type CandidateReviewWorkspaceArtifact = CandidateReviewArtifactBase & {
  kind: 'workspace';
  repoFullName?: string | null;
  commitSha?: string | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  workflowUrl?: string | null;
  commitUrl?: string | null;
  diffUrl?: string | null;
  diffSummary?: Record<string, unknown> | string | null;
  testResults?: CandidateReviewTestResults;
  commitHistory?: CandidateReviewCommitHistoryEntry[] | null;
};

export type CandidateReviewPresentationArtifact =
  CandidateReviewArtifactBase & {
    kind: 'presentation';
    recording?: CandidateReviewRecordingAsset;
    transcript?: CandidateReviewTranscript;
  };

export type CandidateReviewDayArtifact =
  | CandidateReviewMarkdownArtifact
  | CandidateReviewWorkspaceArtifact
  | CandidateReviewPresentationArtifact;

export type CandidateCompletedReviewResponse = {
  candidateSessionId: number;
  status: CandidateSessionBootstrapResponse['status'];
  completedAt: string;
  trial: TrialSummary & { id?: number };
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[];
  artifacts: CandidateReviewDayArtifact[];
};
