import { screen } from '@testing-library/react';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderWinoeReportPage,
  resetWinoeReportTest,
  setFetchForWinoeReport,
  textResponse,
} from './WinoeReportPage.testlib';

describe('WinoeReportPage rendering', () => {
  beforeEach(() => resetWinoeReportTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('winoe-report-print-mode');
  });

  it('toggles print-mode class while mounted', () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse({ status: 'not_started' })
        : textResponse('Not found', 404),
    );
    const { unmount } = renderWinoeReportPage();
    expect(document.body.classList.contains('winoe-report-print-mode')).toBe(
      true,
    );
    unmount();
    expect(document.body.classList.contains('winoe-report-print-mode')).toBe(
      false,
    );
  });

  it('renders ready report from 200 payload', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse(READY_PAYLOAD)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(await screen.findAllByText('78 / 100')).toHaveLength(2);
    expect(screen.getAllByText('Day 1').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Winoe's narrative assessment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Project scaffolding quality/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Architectural coherence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Development process/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reflection & self-awareness/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Score pending/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Hire$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Reject$/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Print \/ Save PDF/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Open evidence link/i }),
    ).toHaveLength(2);
    expect(
      screen.getAllByText(
        /No linked artifacts were returned for this dimension yet\./i,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('renders AI-disabled day cards as human-review-required placeholders', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse({
            status: 'ready',
            generatedAt: '2026-03-11T18:00:00.000Z',
            report: {
              overallWinoeScore: 0.62,
              recommendation: 'lean_hire',
              confidence: 0.58,
              disabledDayIndexes: [2, 3],
              dayScores: [
                {
                  dayIndex: 1,
                  score: 0.71,
                  rubricBreakdown: { communication: 0.8 },
                  evidence: [],
                },
                {
                  dayIndex: 3,
                  score: null,
                  status: 'human_review_required',
                  reason: 'ai_eval_disabled_for_day',
                  rubricBreakdown: {},
                  evidence: [],
                },
              ],
            },
          })
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(await screen.findByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(screen.getByText(/Disabled days: 2, 3/i)).toBeInTheDocument();
    expect(screen.getAllByText('AI evaluation disabled')).toHaveLength(2);
    expect(
      screen.getAllByText(/AI evaluation disabled for this day./i),
    ).toHaveLength(2);
    expect(screen.getAllByText(/Human review required./i)).toHaveLength(2);
  });

  it('renders warning banner when payload includes warnings', async () => {
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse({
            ...READY_PAYLOAD,
            warnings: ['Some artifacts were unavailable during evaluation.'],
          })
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(await screen.findByText(/Report warnings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Some artifacts were unavailable during evaluation./i),
    ).toBeInTheDocument();
  });
});
