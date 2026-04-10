import { Card } from '@/shared/ui/Card';
import {
  formatCalibrationText,
  formatGeneratedAt,
  formatRecommendationLabel,
  formatScorePercent,
  recommendationToneClass,
} from './winoeReportFormatting';

type WinoeScoreHeaderProps = {
  overallWinoeScore: number;
  recommendation: string;
  confidence: number | null;
  calibrationText: string | null;
  generatedAt: string | null;
  disabledDayIndexes: number[];
  scoredDayCount: number;
};

export function WinoeScoreHeader({
  overallWinoeScore,
  recommendation,
  confidence,
  calibrationText,
  generatedAt,
  disabledDayIndexes,
  scoredDayCount,
}: WinoeScoreHeaderProps) {
  const generatedAtLabel = formatGeneratedAt(generatedAt);
  const calibration = formatCalibrationText(
    calibrationText,
    confidence,
    scoredDayCount,
  );
  const recommendationLabel = formatRecommendationLabel(recommendation);

  return (
    <Card className="winoe-report-avoid-break space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">
            Overall Winoe Score
          </p>
          <p className="text-4xl font-bold tracking-tight text-gray-900">
            {formatScorePercent(overallWinoeScore)}
          </p>
        </div>
        <div
          className={`rounded border px-3 py-1 text-sm font-semibold ${recommendationToneClass(recommendation)}`}
        >
          {recommendationLabel}
        </div>
      </div>

      <p className="text-sm text-gray-700">{calibration}</p>

      {generatedAtLabel ? (
        <p className="text-xs text-gray-500">Generated: {generatedAtLabel}</p>
      ) : null}

      {disabledDayIndexes.length > 0 ? (
        <p className="text-xs text-gray-500">
          Disabled days excluded from scoring: {disabledDayIndexes.join(', ')}
        </p>
      ) : null}
    </Card>
  );
}
