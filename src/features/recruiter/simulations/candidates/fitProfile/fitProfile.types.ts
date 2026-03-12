export const FIT_PROFILE_POLL_INTERVAL_MS = 2500;

export type FitProfileViewStatus =
  | 'not_generated'
  | 'generating'
  | 'ready'
  | 'access_denied'
  | 'error';

export type FitProfileEvidence = {
  kind: string;
  ref: string | null;
  url: string | null;
  excerpt: string | null;
  startMs: number | null;
  endMs: number | null;
};

export type FitProfileDayEvaluationStatus = 'evaluated' | 'not_evaluated';

export type FitProfileDayScore = {
  dayIndex: number;
  score: number | null;
  rubricBreakdown: Record<string, unknown>;
  evidence: FitProfileEvidence[];
  evaluationStatus: FitProfileDayEvaluationStatus;
};

export type FitProfileVersion = {
  model: string | null;
  promptVersion: string | null;
  rubricVersion: string | null;
  modelVersion: string | null;
};

export type FitProfileReport = {
  overallFitScore: number;
  recommendation: string;
  confidence: number | null;
  calibrationText: string | null;
  dayScores: FitProfileDayScore[];
  disabledDayIndexes: number[];
  version: FitProfileVersion | null;
  warnings: string[];
};

export type FitProfileFetchOutcome =
  | {
      kind: 'ready';
      report: FitProfileReport;
      generatedAt: string | null;
      warnings: string[];
    }
  | { kind: 'running'; warnings: string[] }
  | { kind: 'not_started' }
  | { kind: 'failed'; errorCode: string | null; message: string };

export type FitProfileState = {
  status: FitProfileViewStatus;
  report: FitProfileReport | null;
  generatedAt: string | null;
  warnings: string[];
  message: string;
  errorCode: string | null;
};
