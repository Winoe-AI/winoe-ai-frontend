import { normalizeFitProfilePayload } from '@/features/recruiter/fit-profile/fitProfile.api';

describe('normalizeFitProfilePayload', () => {
  it('treats human_review_required day scores as AI-disabled', () => {
    const payload = {
      status: 'ready',
      report: {
        overallFitScore: 0.82,
        recommendation: 'hire',
        confidence: 0.73,
        dayScores: [
          {
            dayIndex: 4,
            score: 0.99,
            status: 'human_review_required',
            reason: 'ai_eval_disabled_for_day',
            rubricBreakdown: { quality: 1 },
            evidence: [{ kind: 'commit', ref: 'abc123' }],
          },
        ],
      },
    };

    const result = normalizeFitProfilePayload(payload);
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;

    const day4 = result.report.dayScores[0];
    expect(day4.dayIndex).toBe(4);
    expect(day4.aiEvaluationEnabled).toBe(false);
    expect(day4.evaluationStatus).toBe('not_evaluated');
    expect(day4.reason).toBe('ai_eval_disabled_for_day');
    expect(day4.score).toBeNull();
  });

  it('adds placeholder day entries for disabledDayIndexes missing from dayScores', () => {
    const payload = {
      status: 'ready',
      report: {
        overallFitScore: 0.7,
        recommendation: 'lean_hire',
        confidence: 0.6,
        disabledDayIndexes: [4],
        dayScores: [
          {
            dayIndex: 1,
            score: 0.7,
            status: 'scored',
            rubricBreakdown: {},
            evidence: [],
          },
        ],
      },
    };

    const result = normalizeFitProfilePayload(payload);
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;

    const day4 = result.report.dayScores.find((day) => day.dayIndex === 4);
    expect(day4).toBeTruthy();
    expect(day4?.aiEvaluationEnabled).toBe(false);
    expect(day4?.reason).toBe('ai_eval_disabled_for_day');
    expect(day4?.score).toBeNull();
  });

  it('keeps non-disabled not_evaluated days as AI-enabled', () => {
    const payload = {
      status: 'ready',
      report: {
        overallFitScore: 0.65,
        recommendation: 'lean_hire',
        confidence: 0.5,
        dayScores: [
          {
            dayIndex: 2,
            score: null,
            status: 'not_evaluated',
            rubricBreakdown: {},
            evidence: [],
          },
        ],
      },
    };

    const result = normalizeFitProfilePayload(payload);
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;

    const day2 = result.report.dayScores[0];
    expect(day2.aiEvaluationEnabled).toBe(true);
    expect(day2.evaluationStatus).toBe('not_evaluated');
    expect(day2.reason).toBeNull();
    expect(day2.score).toBeNull();
  });
});
