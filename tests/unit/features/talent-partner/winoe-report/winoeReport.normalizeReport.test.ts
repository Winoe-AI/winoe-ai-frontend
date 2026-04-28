import { normalizeReport } from '@/features/talent-partner/winoe-report/winoeReport.normalizeReport';

describe('normalizeReport', () => {
  it('merges explicit backend dimensions, derived day-level dimensions, and canonical from-scratch dimensions', () => {
    const report = normalizeReport({
      overallWinoeScore: 0.82,
      recommendation: 'strong_hire',
      dimensionScores: [
        {
          key: 'communication_handoff_demo',
          label: 'Communication / Handoff + Demo',
          score: 0.88,
          summary: 'Explicit backend dimension should win.',
          evidence: [
            {
              kind: 'transcript',
              ref: 'transcript-4',
              dayIndex: 4,
              startMs: 15000,
              endMs: 19000,
              excerpt: 'Handoff and demo transcript evidence.',
              dimensionKey: 'communication_handoff_demo',
            },
          ],
        },
        {
          key: 'custom_dimension',
          label: 'Custom dimension',
          score: 0.44,
          summary: 'Unknown backend dimensions should trail the canonical set.',
          evidence: [],
        },
      ],
      dayScores: [
        {
          dayIndex: 1,
          score: 0.7,
          rubricBreakdown: {
            project_scaffolding_quality: 0.72,
            architectural_coherence: 0.68,
          },
          evidence: [
            {
              kind: 'commit',
              ref: 'commit-1',
              dayIndex: 1,
              dimensionKey: 'project_scaffolding_quality',
              excerpt: 'Repository scaffolding commit.',
            },
          ],
        },
        {
          dayIndex: 2,
          score: 0.8,
          rubricBreakdown: {
            development_process: 0.84,
            testing_discipline: 0.8,
          },
          evidence: [
            {
              kind: 'commit_range',
              ref: 'commit-range-2',
              dayIndex: 2,
              dimensionKey: 'development_process',
              excerpt: 'Commit range evidence for process.',
            },
          ],
        },
        {
          dayIndex: 4,
          score: 0.79,
          rubricBreakdown: {
            communication_handoff_demo: 0.12,
          },
          evidence: [],
        },
      ],
      reviewerSummaries: [],
      disabledDayIndexes: [],
    });

    expect(report).not.toBeNull();
    expect(report?.dimensionScores.map((item) => item.key)).toEqual([
      'project_scaffolding_quality',
      'architectural_coherence',
      'development_process',
      'code_quality',
      'testing_discipline',
      'communication_handoff_demo',
      'reflection_self_awareness',
      'custom_dimension',
    ]);
    expect(
      report?.dimensionScores.find(
        (item) => item.key === 'communication_handoff_demo',
      )?.score,
    ).toBe(0.88);
    expect(
      report?.dimensionScores.find(
        (item) => item.key === 'project_scaffolding_quality',
      )?.score,
    ).toBe(0.72);
    expect(
      report?.dimensionScores.find(
        (item) => item.key === 'reflection_self_awareness',
      ),
    ).toMatchObject({
      score: null,
      emptyStateMessage:
        'No linked artifacts were returned for this dimension yet.',
    });
    expect(
      report?.dimensionScores.find((item) => item.key === 'custom_dimension'),
    ).toMatchObject({
      label: 'Custom dimension',
    });
    expect(
      report?.dimensionScores.find((item) => item.key === 'custom_dimension')
        ?.score,
    ).toBe(0.44);
  });

  it('keeps unknown dimensions after the canonical set when no catalog match exists', () => {
    const report = normalizeReport({
      overallWinoeScore: 0.7,
      recommendation: 'lean_hire',
      dimensionScores: [
        {
          key: 'zeta_custom',
          label: 'Zeta custom',
          score: 0.61,
          evidence: [],
        },
      ],
      dayScores: [],
      reviewerSummaries: [],
      disabledDayIndexes: [],
    });

    expect(report?.dimensionScores.at(-1)?.key).toBe('zeta_custom');
    expect(report?.dimensionScores[0]?.key).toBe('project_scaffolding_quality');
  });
});
