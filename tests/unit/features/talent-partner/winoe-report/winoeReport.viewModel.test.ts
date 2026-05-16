import { normalizeReport } from '@/features/talent-partner/winoe-report/winoeReport.normalizeReport';
import { normalizeWinoeReportViewModel } from '@/features/talent-partner/winoe-report/winoeReport.viewModel';

describe('normalizeWinoeReportViewModel', () => {
  it('maps backend evidence pointers into grouped citations for the drawer and appendix', () => {
    const report = normalizeReport({
      overallWinoeScore: 0.84,
      recommendation: 'strong_hire',
      confidence: 0.81,
      dayScores: [
        {
          dayIndex: 1,
          score: 0.72,
          rubricBreakdown: {
            architectural_coherence: 0.72,
          },
          evidence: [
            {
              kind: 'rubric',
              ref: 'day1-design-doc.md:L12-L31',
              dayIndex: 1,
              dimensionKey: 'architectural_coherence',
              excerpt: 'Architecture plan and tradeoffs.',
            },
          ],
        },
        {
          dayIndex: 2,
          score: 0.78,
          rubricBreakdown: {
            testing_discipline: 0.78,
          },
          evidence: [
            {
              kind: 'tests',
              ref: 'day2-tests.txt:L1-L4',
              dayIndex: 2,
              dimensionKey: 'testing_discipline',
              excerpt: 'Kickoff tests established the workflow shape.',
            },
          ],
        },
        {
          dayIndex: 4,
          score: 0.86,
          rubricBreakdown: {
            communication_handoff_demo: 0.86,
          },
          evidence: [
            {
              kind: 'transcript',
              ref: 'handoff-demo-transcript.txt:02:14-02:48',
              dayIndex: 4,
              dimensionKey: 'communication_handoff_demo',
              excerpt: 'Demo transcript with tradeoffs and next steps.',
              startMs: 0,
              endMs: 120000,
            },
          ],
        },
        {
          dayIndex: 5,
          score: 0.8,
          rubricBreakdown: {
            reflection_self_awareness: 0.8,
          },
          evidence: [
            {
              kind: 'submission',
              ref: 'day5-reflection.md:L8-L22',
              dayIndex: 5,
              dimensionKey: 'reflection_self_awareness',
              excerpt: 'Reflection on tradeoffs and next steps.',
            },
          ],
        },
      ],
      reviewerSummaries: [],
      disabledDayIndexes: [],
    });

    const viewModel = normalizeWinoeReportViewModel({
      candidateName: 'Avery Chen',
      trialTitle: 'YC Demo Backend Engineer Trial',
      generatedAt: '2026-05-14T15:56:49Z',
      report: report!,
    });

    expect(
      viewModel.dimensions.find((item) => item.id === 'architectural_coherence')
        ?.citations,
    ).toHaveLength(1);
    expect(
      viewModel.dimensions.find((item) => item.id === 'testing_discipline')
        ?.citations[0],
    ).toMatchObject({
      groupLabel: 'Day 2/3 — Code',
      artifactRef: 'day2-tests.txt:L1-L4',
      renderMode: 'code',
    });
    expect(
      viewModel.dimensions.find(
        (item) => item.id === 'communication_handoff_demo',
      )?.citations[0],
    ).toMatchObject({
      groupLabel: 'Day 4 — Handoff + Demo',
      artifactRef: 'handoff-demo-transcript.txt:02:14-02:48',
      renderMode: 'demo',
      startMs: 0,
      endMs: 120000,
    });
    expect(
      viewModel.dimensions.find(
        (item) => item.id === 'reflection_self_awareness',
      )?.citations[0],
    ).toMatchObject({
      groupLabel: 'Day 5 — Reflection',
      artifactRef: 'day5-reflection.md:L8-L22',
      renderMode: 'markdown',
    });
    expect(
      new Set(
        viewModel.dimensions.flatMap((item) =>
          item.citations.map((citation) => citation.groupLabel),
        ),
      ),
    ).toEqual(
      new Set([
        'Day 1 — Design Doc',
        'Day 2/3 — Code',
        'Day 4 — Handoff + Demo',
        'Day 5 — Reflection',
      ]),
    );
  });
});
