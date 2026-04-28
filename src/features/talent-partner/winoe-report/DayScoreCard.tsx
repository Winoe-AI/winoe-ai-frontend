import { Card } from '@/shared/ui/Card';
import type { WinoeReportDayScore } from './winoeReport.types';
import { EvidenceList } from './EvidenceList';
import {
  formatCountLabel,
  formatStatusLabel,
  formatRubricKey,
  formatRubricValue,
  formatScoreOutOf100,
} from './winoeReportFormatting';
import { formatDayLabel } from './winoeReport.catalog';

type DayScoreCardProps = {
  dayScore: WinoeReportDayScore;
};

export function DayScoreCard({ dayScore }: DayScoreCardProps) {
  const rubricRows = Object.entries(dayScore.rubricBreakdown);
  const isAiEvaluationDisabled = !dayScore.aiEvaluationEnabled;
  const isNotEvaluated = dayScore.evaluationStatus === 'not_evaluated';
  const dayLabel = dayScore.dayLabel ?? formatDayLabel(dayScore.dayIndex);
  const scoreLabel =
    isAiEvaluationDisabled || isNotEvaluated
      ? 'Score pending'
      : formatScoreOutOf100(dayScore.score);

  return (
    <Card className="winoe-report-avoid-break space-y-4 border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Day {dayScore.dayIndex}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {dayLabel}
          </h2>
        </div>
        <div
          className={
            isAiEvaluationDisabled || isNotEvaluated
              ? 'rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700'
              : 'rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800'
          }
        >
          {isAiEvaluationDisabled
            ? 'AI evaluation disabled'
            : isNotEvaluated
              ? 'Not evaluated'
              : scoreLabel}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
          {formatStatusLabel(dayScore.statusLabel ?? dayScore.evaluationStatus)}
        </span>
        {dayScore.reviewerSummary ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            Reviewer summary available
          </span>
        ) : null}
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
          {formatCountLabel(dayScore.evidence.length, 'linked artifact')}
        </span>
      </div>

      {isAiEvaluationDisabled ? (
        <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>AI evaluation disabled for this day.</p>
          <p className="font-medium text-slate-900">Human review required.</p>
        </div>
      ) : null}

      {!isAiEvaluationDisabled && isNotEvaluated ? (
        <p className="text-sm text-slate-600">
          This day was not evaluated and does not affect the overall Winoe
          Score.
        </p>
      ) : null}

      {dayScore.summary ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Day summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {dayScore.summary}
          </p>
        </div>
      ) : null}

      {dayScore.reviewerSummary ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            Sub-agent summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {dayScore.reviewerSummary}
          </p>
        </div>
      ) : null}

      {!isAiEvaluationDisabled ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Rubric Breakdown
          </h3>
          {rubricRows.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">
              No rubric breakdown provided.
            </p>
          ) : (
            <dl className="mt-2 space-y-1">
              {rubricRows.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(120px,1fr)_2fr] gap-2"
                >
                  <dt className="text-xs font-medium text-slate-600">
                    {formatRubricKey(key)}
                  </dt>
                  <dd className="text-sm text-slate-800">
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
          <h3 className="text-sm font-semibold text-slate-950">
            Evidence Trail
          </h3>
          <div className="mt-2">
            <EvidenceList
              evidence={dayScore.evidence}
              emptyMessage="No linked artifacts were returned for this day yet."
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
