import { screen } from '@testing-library/react';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderFitProfilePage,
  resetFitProfileTest,
  setFetchForFitProfile,
  textResponse,
} from './FitProfilePage.testlib';

describe('FitProfilePage rendering', () => {
  beforeEach(() => resetFitProfileTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('toggles print-mode class while mounted', () => {
    setFetchForFitProfile(async (url) =>
      url === '/api/candidate_sessions/2/fit_profile'
        ? jsonResponse({ status: 'not_started' })
        : textResponse('Not found', 404),
    );
    const { unmount } = renderFitProfilePage();
    expect(document.body.classList.contains('fit-profile-print-mode')).toBe(
      true,
    );
    unmount();
    expect(document.body.classList.contains('fit-profile-print-mode')).toBe(
      false,
    );
  });

  it('renders ready report from 200 payload', async () => {
    setFetchForFitProfile(async (url) =>
      url === '/api/candidate_sessions/2/fit_profile'
        ? jsonResponse(READY_PAYLOAD)
        : textResponse('Not found', 404),
    );
    renderFitProfilePage();
    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Print \/ Save PDF/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open evidence link/i }),
    ).toHaveAttribute('target', '_blank');
  });

  it('renders AI-disabled day cards as human-review-required placeholders', async () => {
    setFetchForFitProfile(async (url) =>
      url === '/api/candidate_sessions/2/fit_profile'
        ? jsonResponse({
            status: 'ready',
            generatedAt: '2026-03-11T18:00:00.000Z',
            report: {
              overallFitScore: 0.62,
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
    renderFitProfilePage();
    expect(await screen.findByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(
      screen.getByText(/Disabled days excluded from scoring: 2, 3/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('AI Evaluation: Disabled')).toHaveLength(2);
    expect(
      screen.getAllByText(/AI evaluation disabled for this day./i),
    ).toHaveLength(2);
    expect(screen.getAllByText(/Human review required./i)).toHaveLength(2);
  });

  it('renders warning banner when payload includes warnings', async () => {
    setFetchForFitProfile(async (url) =>
      url === '/api/candidate_sessions/2/fit_profile'
        ? jsonResponse({
            ...READY_PAYLOAD,
            warnings: ['Some artifacts were unavailable during evaluation.'],
          })
        : textResponse('Not found', 404),
    );
    renderFitProfilePage();
    expect(await screen.findByText(/Report warnings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Some artifacts were unavailable during evaluation./i),
    ).toBeInTheDocument();
  });
});
