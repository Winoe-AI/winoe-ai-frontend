import { Card } from '@/shared/ui/Card';
import { DayScoreCard } from './DayScoreCard';
import { WinoeScoreHeader } from './WinoeScoreHeader';
import type { WinoeReportReport } from './winoeReport.types';

type Props = {
  report: WinoeReportReport;
  generatedAt: string | null;
};

export function WinoeReportReadySection({ report, generatedAt }: Props) {
  const scoredDayCount = report.dayScores.filter(
    (item) => item.evaluationStatus === 'evaluated',
  ).length;

  return (
    <>
      <WinoeScoreHeader
        overallWinoeScore={report.overallWinoeScore}
        recommendation={report.recommendation}
        confidence={report.confidence}
        calibrationText={report.calibrationText}
        generatedAt={generatedAt}
        disabledDayIndexes={report.disabledDayIndexes}
        scoredDayCount={scoredDayCount}
      />
      {report.dayScores.length === 0 ? (
        <Card className="winoe-report-avoid-break text-sm text-gray-600">
          No day-level scores are available for this report.
        </Card>
      ) : (
        <section className="space-y-3">
          {report.dayScores.map((dayScore) => (
            <DayScoreCard
              key={`winoe-report-day-${dayScore.dayIndex}`}
              dayScore={dayScore}
            />
          ))}
        </section>
      )}
    </>
  );
}
