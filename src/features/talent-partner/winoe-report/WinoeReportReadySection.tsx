import { Card } from '@/shared/ui/Card';
import { DayScoreCard } from './DayScoreCard';
import { WinoeDimensionBreakdown } from './WinoeDimensionBreakdown';
import { WinoeScoreHeader } from './WinoeScoreHeader';
import { WinoeReviewerSummaries } from './WinoeReviewerSummaries';
import type { WinoeReportReport } from './winoeReport.types';

type Props = {
  report: WinoeReportReport;
  generatedAt: string | null;
};

export function WinoeReportReadySection({ report, generatedAt }: Props) {
  const scoredDayCount = report.dayScores.filter(
    (item) => item.evaluationStatus === 'evaluated',
  ).length;
  const narrativeAssessment =
    report.narrativeAssessment ?? report.summary ?? report.personaVoice ?? null;

  return (
    <>
      <WinoeScoreHeader
        overallWinoeScore={report.overallWinoeScore}
        recommendation={report.recommendation}
        confidence={report.confidence}
        calibrationText={report.calibrationText}
        generatedAt={generatedAt}
        disabledDayIndexes={report.disabledDayIndexes}
        dimensionCount={report.dimensionScores.length}
        scoredDayCount={scoredDayCount}
        narrativeAssessment={narrativeAssessment}
      />
      <WinoeDimensionBreakdown dimensions={report.dimensionScores} />

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Per-day scores
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Day 2 and Day 3 reflect the from-scratch build sequence, repository
            structure, commit history, tests, and implementation progression.
          </p>
        </div>
        {report.dayScores.length === 0 ? (
          <Card className="winoe-report-avoid-break border-slate-200 text-sm text-slate-600">
            No day-level scores are available for this report yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {report.dayScores.map((dayScore) => (
              <DayScoreCard
                key={`winoe-report-day-${dayScore.dayIndex}`}
                dayScore={dayScore}
              />
            ))}
          </div>
        )}
      </section>

      <WinoeReviewerSummaries reviewerSummaries={report.reviewerSummaries} />
    </>
  );
}
