export type CandidateCompareWinoeReportStatus =
  | 'not_generated'
  | 'generating'
  | 'ready'
  | 'failed';

export type CandidateCompareDayCompletion = {
  dayIndex: number;
  completed: boolean;
};

export type CandidateCompareRow = {
  candidateSessionId: string;
  trialId: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  candidateLabel: string;
  status: string | null;
  winoeReportStatus: CandidateCompareWinoeReportStatus;
  overallWinoeScore: number | null;
  recommendation: string | null;
  updatedAt: string | null;
  strengths: string[];
  risks: string[];
  dayCompletion: CandidateCompareDayCompletion[];
};
