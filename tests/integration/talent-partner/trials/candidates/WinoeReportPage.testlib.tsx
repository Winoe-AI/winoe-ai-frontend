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
import { makeTrialDetailPayload } from '../../../../setup/fixtures/backendContracts';
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
    recommendation: 'strong_hire',
    confidence: 0.74,
    calibrationText:
      'Evidence is coherent across the Trial and the linked artifacts are readable.',
    narrativeAssessment:
      'Winoe sees a deliberate build sequence: scaffold first, then implementation, then tests and handoff. The evidence is strong enough to inspect directly, but the Talent Partner should still review the drill-down before deciding.',
    personaVoice:
      'I evaluate the Trial through commits, docs, timestamps, and reviewer summaries rather than personality or guesswork.',
    summary:
      'The report is backed by linked artifacts across the Trial timeline.',
    dimensionScores: [
      {
        key: 'project_scaffolding_quality',
        label: 'Project scaffolding quality',
        score: 0.84,
        summary:
          'Repository structure was established early and kept coherent.',
        evidence: [
          {
            kind: 'file_creation_timeline',
            label: 'File timeline evidence',
            ref: 'timeline-1',
            excerpt: 'Workspace structure appears before feature work starts.',
            dimensionKey: 'project_scaffolding_quality',
            dayIndex: 2,
          },
        ],
      },
      {
        key: 'communication_handoff_demo',
        label: 'Communication / Handoff + Demo',
        score: 0.76,
        summary:
          'The Handoff + Demo transcript explains tradeoffs and next steps clearly.',
        evidence: [
          {
            kind: 'transcript',
            label: 'Handoff + Demo transcript',
            ref: 'transcript-4',
            excerpt: 'Candidate describes architecture and follow-up items.',
            startMs: 15000,
            endMs: 19000,
            dayIndex: 4,
          },
        ],
      },
    ],
    reviewerSummaries: [
      {
        reviewerName: 'Design Doc Reviewer',
        dayIndexes: [1],
        score: 0.81,
        summary:
          'The design doc frames the API clearly and makes the open questions visible.',
        strengths: ['Clear structure', 'Explicit tradeoffs'],
        concerns: ['Scaling assumptions stay implicit'],
        evidence: [
          {
            kind: 'design_doc_section',
            label: 'Design doc evidence',
            ref: 'doc-1',
            excerpt: 'Architecture brief with API boundaries.',
            dayIndex: 1,
          },
        ],
        sourceLabel: 'Design Doc Reviewer',
      },
      {
        reviewerName: 'Winoe synthesis',
        dayIndexes: [1, 2, 3, 4, 5],
        score: 0.78,
        summary:
          'Winoe sees a coherent build path with useful evidence links throughout the Trial.',
        strengths: [],
        concerns: [],
        evidence: [],
        sourceLabel: 'Winoe synthesis',
      },
    ],
    dayScores: [
      {
        dayIndex: 1,
        score: 0.7,
        summary:
          'Design work explains the boundaries and API contract clearly.',
        reviewerSummary:
          'The design doc reviewer wanted the scaling assumptions called out more explicitly.',
        rubricBreakdown: {
          project_scaffolding_quality: 0.72,
          architectural_coherence: 0.68,
        },
        evidence: [
          {
            kind: 'commit',
            label: 'Commit evidence',
            ref: 'abc123',
            url: 'https://github.com/org/repo/commit/abc123',
            excerpt: 'Introduced clean module boundaries.',
            dayIndex: 1,
            dimensionKey: 'project_scaffolding_quality',
          },
        ],
      },
      {
        dayIndex: 2,
        score: 0.82,
        summary:
          'Implementation started from repository structure and moved through clear commit steps.',
        rubricBreakdown: {
          development_process: 0.84,
          testing_discipline: 0.8,
        },
        evidence: [
          {
            kind: 'commit_range',
            label: 'Commit range evidence',
            ref: 'range-2',
            excerpt: 'Core build work and test additions progressed in order.',
            dayIndex: 2,
            dimensionKey: 'development_process',
          },
        ],
      },
      {
        dayIndex: 4,
        score: 0.79,
        summary:
          'Handoff + Demo was concise and linked back to the implementation choices.',
        rubricBreakdown: {
          communication_handoff_demo: 0.79,
        },
        evidence: [
          {
            kind: 'transcript',
            label: 'Handoff + Demo transcript',
            ref: 'transcript-4',
            excerpt: 'Candidate describes architecture and follow-up items.',
            startMs: 15000,
            endMs: 19000,
            dayIndex: 4,
            dimensionKey: 'communication_handoff_demo',
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
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/trials/1') {
        return jsonResponse(makeTrialDetailPayload({ id: '1' }));
      }
      if (url === '/api/trials/1/candidates') {
        return jsonResponse([
          {
            candidateSessionId: 2,
            candidateName: 'Jordan Reyes',
            status: 'completed',
            hasReport: true,
          },
        ]);
      }
      return handler(url, init);
    },
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function renderWinoeReportPage() {
  return render(<WinoeReportPage />);
}

export { WinoeReportPage, React, jsonResponse, textResponse };
