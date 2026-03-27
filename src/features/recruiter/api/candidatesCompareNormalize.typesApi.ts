export type CandidateCompareFitProfileStatus =
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
  candidateName: string | null;
  candidateEmail: string | null;
  candidateLabel: string;
  status: string | null;
  fitProfileStatus: CandidateCompareFitProfileStatus;
  overallFitScore: number | null;
  recommendation: string | null;
  updatedAt: string | null;
  strengths: string[];
  risks: string[];
  dayCompletion: CandidateCompareDayCompletion[];
};
