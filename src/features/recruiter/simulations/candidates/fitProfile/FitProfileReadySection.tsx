import { Card } from '@/shared/ui/Card';
import { DayScoreCard } from './DayScoreCard';
import { FitScoreHeader } from './FitScoreHeader';
import type { FitProfileReport } from './fitProfile.types';

type Props = {
  report: FitProfileReport;
  generatedAt: string | null;
};

export function FitProfileReadySection({ report, generatedAt }: Props) {
  const scoredDayCount = report.dayScores.filter(
    (item) => item.evaluationStatus === 'evaluated',
  ).length;

  return (
    <>
      <FitScoreHeader
        overallFitScore={report.overallFitScore}
        recommendation={report.recommendation}
        confidence={report.confidence}
        calibrationText={report.calibrationText}
        generatedAt={generatedAt}
        disabledDayIndexes={report.disabledDayIndexes}
        scoredDayCount={scoredDayCount}
      />
      {report.dayScores.length === 0 ? (
        <Card className="fit-profile-avoid-break text-sm text-gray-600">
          No day-level scores are available for this report.
        </Card>
      ) : (
        <section className="space-y-3">
          {report.dayScores.map((dayScore) => (
            <DayScoreCard
              key={`fit-profile-day-${dayScore.dayIndex}`}
              dayScore={dayScore}
            />
          ))}
        </section>
      )}
    </>
  );
}
