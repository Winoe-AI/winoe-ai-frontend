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
  candidateName: overrides.candidateName ?? null,
  candidateEmail: overrides.candidateEmail ?? null,
  candidateLabel: overrides.candidateLabel ?? overrides.candidateSessionId,
  status: overrides.status ?? 'completed',
  winoeReportStatus: overrides.winoeReportStatus ?? 'ready',
  overallWinoeScore: overrides.overallWinoeScore ?? 0.8,
  recommendation: overrides.recommendation ?? 'hire',
  updatedAt: overrides.updatedAt ?? '2026-03-16T00:00:00Z',
  strengths: overrides.strengths ?? [],
  risks: overrides.risks ?? [],
  dayCompletion: overrides.dayCompletion ?? [],
});

export const baseProps = {
  trialId: 'trial-1',
  candidateCount: 2,
  candidatesLoading: false,
  compareLoading: false,
  compareError: null,
  rows: [] as CandidateCompareRow[],
  generatingIds: {} as Record<string, boolean>,
  onRetry: jest.fn(),
  onGenerate: jest.fn(),
};
