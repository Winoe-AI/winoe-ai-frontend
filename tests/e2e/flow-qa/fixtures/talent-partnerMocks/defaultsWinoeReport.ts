import { iso } from './shared';
import { makeWinoeReportStatusPayload } from '../../../../setup/fixtures/backendContracts';

export function buildDefaultWinoeReportPayload(candidateSessionId: number) {
  return makeWinoeReportStatusPayload({
    status: 'ready',
    generatedAt: iso('2026-03-18T08:00:00Z'),
    report: {
      overallWinoeScore: 0.82,
      recommendation: 'strong_hire',
      confidence: 0.86,
      calibrationText:
        'High confidence from consistent artifact quality and strong day-level evidence.',
      dayScores: [
        {
          dayIndex: 1,
          score: 0.8,
          rubricBreakdown: { clarity: 0.82, architecture: 0.78 },
          evidence: [
            {
              kind: 'text',
              ref: `submission:${candidateSessionId}:day1`,
              excerpt: 'Clear architecture and tradeoff framing.',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 2,
          score: 0.85,
          rubricBreakdown: { implementation: 0.87, testing: 0.84 },
          evidence: [
            {
              kind: 'github',
              ref: 'workflow:day2',
              url: 'https://github.com/winoe-ai/candidate-repo/actions/runs/2',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 3,
          score: 0.81,
          rubricBreakdown: { debugging: 0.8, completeness: 0.82 },
          evidence: [
            {
              kind: 'github',
              ref: 'workflow:day3',
              url: 'https://github.com/winoe-ai/candidate-repo/actions/runs/3',
            },
          ],
          evaluationStatus: 'evaluated',
        },
        {
          dayIndex: 4,
          score: 0.79,
          rubricBreakdown: { communication: 0.8, handoff: 0.78 },
          evidence: [
            {
              kind: 'transcript',
              ref: 'day4-transcript',
              excerpt: 'Candidate explains rollout risks and next steps.',
              startMs: 0,
              endMs: 1600,
            },
          ],
          evaluationStatus: 'evaluated',
        },
      ],
      disabledDayIndexes: [5],
      version: {
        model: 'gpt-5.4',
        promptVersion: 'winoe-report-v1',
        rubricVersion: 'rubric-v1',
        modelVersion: '2026-02-15',
      },
      warnings: [],
    },
  });
}
