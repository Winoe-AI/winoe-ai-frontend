import React from 'react';
import type { CandidateCompareRow } from '@/features/talent-partner/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

export const makeRow = (
  overrides: Partial<CandidateCompareRow> & { candidateSessionId: string },
): CandidateCompareRow => ({
  candidateSessionId: overrides.candidateSessionId,
  trialId: overrides.trialId !== undefined ? overrides.trialId : 'trial-1',
  candidateName:
    overrides.candidateName !== undefined ? overrides.candidateName : null,
  candidateEmail:
    overrides.candidateEmail !== undefined ? overrides.candidateEmail : null,
  candidateLabel:
    overrides.candidateLabel !== undefined
      ? overrides.candidateLabel
      : overrides.candidateSessionId,
  status: overrides.status !== undefined ? overrides.status : 'completed',
  winoeReportStatus:
    overrides.winoeReportStatus !== undefined
      ? overrides.winoeReportStatus
      : 'ready',
  overallWinoeScore:
    overrides.overallWinoeScore !== undefined
      ? overrides.overallWinoeScore
      : 0.8,
  recommendation:
    overrides.recommendation !== undefined
      ? overrides.recommendation
      : 'strong_hire',
  updatedAt:
    overrides.updatedAt !== undefined
      ? overrides.updatedAt
      : '2026-03-16T00:00:00Z',
  strengths: overrides.strengths !== undefined ? overrides.strengths : [],
  risks: overrides.risks !== undefined ? overrides.risks : [],
  dayCompletion:
    overrides.dayCompletion !== undefined ? overrides.dayCompletion : [],
});

export const baseProps = {
  trialId: 'trial-1',
  candidateCount: 2,
  candidatesLoading: false,
  compareLoading: false,
  compareError: null,
  rows: [] as CandidateCompareRow[],
  onRetry: jest.fn(),
};
