import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import { render } from '@testing-library/react';
import WinoeReportPage from '@/features/talent-partner/winoe-report/WinoeReportPage';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
} from '../../../../setup/responseHelpers';
import { __resetHttpClientCache } from '@/platform/api-client/client';

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

export const READY_PAYLOAD = {
  status: 'ready',
  generatedAt: '2026-03-11T18:00:00.000Z',
  report: {
    overallWinoeScore: 0.78,
    recommendation: 'hire',
    confidence: 0.74,
    dayScores: [
      {
        dayIndex: 1,
        score: 0.7,
        rubricBreakdown: { communication: 0.8 },
        evidence: [
          {
            kind: 'commit',
            ref: 'abc123',
            url: 'https://github.com/org/repo/commit/abc123',
            excerpt: 'Introduced clean module boundaries.',
          },
        ],
      },
    ],
    version: {
      model: 'winoe-fit-evaluator',
      promptVersion: 'winoe-report-v1',
      rubricVersion: 'rubric-v1',
    },
  },
};

export function resetWinoeReportTest() {
  __resetHttpClientCache();
  jest.clearAllMocks();
  jest.useRealTimers();
  setMockParams({ id: '1', candidateSessionId: '2' });
  document.body.classList.remove('winoe-report-print-mode');
}

export function setFetchForWinoeReport(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  const fetchMock = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(getRequestUrl(input), init),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function renderWinoeReportPage() {
  return render(<WinoeReportPage />);
}

export { WinoeReportPage, React, jsonResponse, textResponse };
