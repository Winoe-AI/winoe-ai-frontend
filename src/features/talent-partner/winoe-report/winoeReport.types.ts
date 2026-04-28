export const WINOE_REPORT_POLL_INTERVAL_MS = 10_000;

export type WinoeReportViewStatus =
  | 'not_generated'
  | 'generating'
  | 'ready'
  | 'access_denied'
  | 'error';

export type WinoeReportEvidence = {
  kind: string;
  ref: string | null;
  url: string | null;
  excerpt: string | null;
  startMs: number | null;
  endMs: number | null;
  label?: string | null;
  title?: string | null;
  description?: string | null;
  dayIndex?: number | null;
  dayLabel?: string | null;
  sourceDay?: number | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  dimensionKey?: string | null;
  dimensionLabel?: string | null;
  anchor?: string | null;
};

export type WinoeReportDayEvaluationStatus = 'evaluated' | 'not_evaluated';

export type WinoeReportDayScore = {
  dayIndex: number;
  dayLabel?: string | null;
  score: number | null;
  rubricBreakdown: Record<string, unknown>;
  evidence: WinoeReportEvidence[];
  evaluationStatus: WinoeReportDayEvaluationStatus;
  reason: string | null;
  aiEvaluationEnabled: boolean;
  summary?: string | null;
  statusLabel?: string | null;
  reviewerSummary?: string | null;
};

export type WinoeReportVersion = {
  model: string | null;
  promptVersion: string | null;
  rubricVersion: string | null;
  modelVersion: string | null;
};

export type WinoeReportDimension = {
  key: string;
  label: string;
  score: number | null;
  summary: string | null;
  evidence: WinoeReportEvidence[];
  evidenceCount: number;
  linkedArtifactCount: number;
  sourceKeys: string[];
  emptyStateMessage: string | null;
  description?: string | null;
};

export type WinoeReportReviewerSummary = {
  reviewerName: string;
  dayIndexes: number[];
  score: number | null;
  summary: string | null;
  strengths: string[];
  concerns: string[];
  evidence: WinoeReportEvidence[];
  sourceLabel: string | null;
};

export type WinoeReportReport = {
  overallWinoeScore: number;
  recommendation: string;
  confidence: number | null;
  calibrationText: string | null;
  narrativeAssessment: string | null;
  personaVoice: string | null;
  summary: string | null;
  dimensionScores: WinoeReportDimension[];
  reviewerSummaries: WinoeReportReviewerSummary[];
  dayScores: WinoeReportDayScore[];
  disabledDayIndexes: number[];
  version: WinoeReportVersion | null;
  warnings: string[];
};

export type WinoeReportFetchOutcome =
  | {
      kind: 'ready';
      report: WinoeReportReport;
      generatedAt: string | null;
      warnings: string[];
    }
  | { kind: 'running'; warnings: string[] }
  | { kind: 'not_started' }
  | { kind: 'failed'; errorCode: string | null; message: string };

export type WinoeReportState = {
  status: WinoeReportViewStatus;
  report: WinoeReportReport | null;
  generatedAt: string | null;
  warnings: string[];
  message: string;
  errorCode: string | null;
};
