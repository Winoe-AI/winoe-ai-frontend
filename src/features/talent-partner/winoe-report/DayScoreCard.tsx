import { Card } from '@/shared/ui/Card';
import type { WinoeReportDayScore } from './winoeReport.types';
import { EvidenceList } from './EvidenceList';
import {
  formatRubricKey,
  formatRubricValue,
  formatScorePercent,
} from './winoeReportFormatting';

type DayScoreCardProps = {
  dayScore: WinoeReportDayScore;
};

export function DayScoreCard({ dayScore }: DayScoreCardProps) {
  const rubricRows = Object.entries(dayScore.rubricBreakdown);
  const isAiEvaluationDisabled = !dayScore.aiEvaluationEnabled;
  const isNotEvaluated = dayScore.evaluationStatus === 'not_evaluated';

  return (
    <Card className="winoe-report-avoid-break space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Day {dayScore.dayIndex}
        </h2>
        <div
          className={
            isAiEvaluationDisabled
              ? 'rounded border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700'
              : isNotEvaluated
                ? 'rounded border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700'
                : 'rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700'
          }
        >
          {isAiEvaluationDisabled
            ? 'AI Evaluation: Disabled'
            : isNotEvaluated
              ? 'Not evaluated'
              : formatScorePercent(dayScore.score ?? 0)}
        </div>
      </div>

      {isAiEvaluationDisabled ? (
        <div className="space-y-1 text-sm text-gray-700">
          <p>AI evaluation disabled for this day.</p>
          <p className="font-medium text-gray-800">Human review required.</p>
        </div>
      ) : null}

      {!isAiEvaluationDisabled && isNotEvaluated ? (
        <p className="text-sm text-gray-600">
          This day was not evaluated and does not affect overall winoe score.
        </p>
      ) : null}

      {!isAiEvaluationDisabled ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Rubric Breakdown
          </h3>
          {rubricRows.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">
              No rubric breakdown provided.
            </p>
          ) : (
            <dl className="mt-2 space-y-1">
              {rubricRows.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(120px,1fr)_2fr] gap-2"
                >
                  <dt className="text-xs font-medium text-gray-600">
                    {formatRubricKey(key)}
                  </dt>
                  <dd className="text-sm text-gray-800">
                    {formatRubricValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ) : null}

      {!isAiEvaluationDisabled ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Evidence Trail
          </h3>
          <div className="mt-2">
            <EvidenceList evidence={dayScore.evidence} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
