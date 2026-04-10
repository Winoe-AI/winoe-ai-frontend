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
};

export type WinoeReportDayEvaluationStatus = 'evaluated' | 'not_evaluated';

export type WinoeReportDayScore = {
  dayIndex: number;
  score: number | null;
  rubricBreakdown: Record<string, unknown>;
  evidence: WinoeReportEvidence[];
  evaluationStatus: WinoeReportDayEvaluationStatus;
  reason: string | null;
  aiEvaluationEnabled: boolean;
};

export type WinoeReportVersion = {
  model: string | null;
  promptVersion: string | null;
  rubricVersion: string | null;
  modelVersion: string | null;
};

export type WinoeReportReport = {
  overallWinoeScore: number;
  recommendation: string;
  confidence: number | null;
  calibrationText: string | null;
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
