import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();
    const readyPayload = {
      ...READY_PAYLOAD,
      report: {
        ...READY_PAYLOAD.report,
        dimensionScores: READY_PAYLOAD.report.dimensionScores.map(
          (dimension, index) =>
            index === 0
              ? {
                  ...dimension,
                  evidence: [
                    {
                      ...dimension.evidence[0],
                      url: 'https://github.com/org/repo/commit/abc123',
                    },
                  ],
                }
              : dimension,
        ),
      },
    };
    setFetchForWinoeReport(async (url) =>
      url === '/api/candidate_sessions/2/winoe_report'
        ? jsonResponse(readyPayload)
        : textResponse('Not found', 404),
    );
    renderWinoeReportPage();
    expect(
      (await screen.findAllByText(/Project scaffolding quality/i)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Winoe Score/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Winoe Report$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Footer Actions/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Candidate's Work/i)).toBeInTheDocument();
    expect(screen.getByText(/Narrative Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Disagree\? Send feedback →/i)).toBeInTheDocument();
    expect(document.querySelector('.prose-narrative')).toHaveStyle({
      fontFamily: 'var(--font-serif)',
    });
    expect(
      screen.getAllByText(/Project scaffolding quality/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Repository structure was established early/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: /View evidence/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId('view-evidence-button')[0]).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /Download PDF/i }),
    ).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /Share with team/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Compare to other candidates/i }),
    ).toHaveAttribute('href', '/dashboard/trials/1#benchmarks');
    await user.click(
      screen.getAllByRole('button', { name: /View evidence/i })[0],
    );
    const drawer = screen.getByRole('dialog', {
      name: /Evidence Trail · Project scaffolding quality/i,
    });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText(/Dimension score/i)).toBeInTheDocument();
    expect(
      within(drawer).getByText(/Project scaffolding quality/i),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole('heading', {
        name: /Day 2\/3 — Code/i,
        level: 4,
      }),
    ).toBeInTheDocument();
    expect(within(drawer).getAllByText('abc123').length).toBeGreaterThan(0);
    expect(
      within(drawer).getByText(/Repository structure was established early/i),
    ).toBeInTheDocument();
    expect(
      within(drawer).getAllByRole('link', { name: /Open evidence link/i })
        .length,
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Share with team/i }));
    expect(
      await screen.findByRole('dialog', { name: /Share this report/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Secure team sharing is not enabled yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy link/i })).toBeDisabled();
    expect(screen.queryByLabelText(/Link expiry/i)).not.toBeInTheDocument();
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
    expect(
      await screen.findByText('Day 2 — Code (Implementation Kickoff)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Day 3 — Code (Implementation Wrap-Up)'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/AI evaluation disabled for this day\./i).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText(/Human review required\./i).length,
    ).toBeGreaterThanOrEqual(2);
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
