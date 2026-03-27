import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import { render } from '@testing-library/react';
import FitProfilePage from '@/features/recruiter/simulations/candidates/fitProfile/FitProfilePage';
import { getRequestUrl, jsonResponse, textResponse } from '../../../../setup/responseHelpers';
import { __resetHttpClientCache } from '@/lib/api/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

export const READY_PAYLOAD = {
  status: 'ready',
  generatedAt: '2026-03-11T18:00:00.000Z',
  report: {
    overallFitScore: 0.78,
    recommendation: 'hire',
    confidence: 0.74,
    dayScores: [{ dayIndex: 1, score: 0.7, rubricBreakdown: { communication: 0.8 }, evidence: [{ kind: 'commit', ref: 'abc123', url: 'https://github.com/org/repo/commit/abc123', excerpt: 'Introduced clean module boundaries.' }] }],
    version: { model: 'tenon-fit-evaluator', promptVersion: 'fit-profile-v1', rubricVersion: 'rubric-v1' },
  },
};

export function resetFitProfileTest() {
  __resetHttpClientCache();
  jest.clearAllMocks();
  jest.useRealTimers();
  setMockParams({ id: '1', candidateSessionId: '2' });
  document.body.classList.remove('fit-profile-print-mode');
}

export function setFetchForFitProfile(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(getRequestUrl(input), init));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function renderFitProfilePage() {
  return render(<FitProfilePage />);
}

export { FitProfilePage, React, jsonResponse, textResponse };
