import { Card } from '@/shared/ui/Card';
import type { WinoeReportReviewerSummary } from './winoeReport.types';
import { EvidenceList } from './EvidenceList';
import { formatCountLabel, formatScoreOutOf100 } from './winoeReportFormatting';
import { formatDayLabel } from './winoeReport.catalog';

type Props = {
  reviewerSummaries: WinoeReportReviewerSummary[];
};

function formatDays(dayIndexes: number[]): string {
  if (dayIndexes.length === 0) return 'All days';
  return dayIndexes.map((dayIndex) => formatDayLabel(dayIndex)).join(', ');
}

export function WinoeReviewerSummaries({ reviewerSummaries }: Props) {
  if (reviewerSummaries.length === 0) {
    return (
      <Card className="winoe-report-avoid-break border-slate-200 bg-white">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Reviewer sub-agent summaries
          </h2>
          <p className="text-sm text-slate-600">
            No reviewer summaries were returned yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Reviewer sub-agent summaries
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Concise summary cards from the reviewer sub-agents and Winoe
          synthesis.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {reviewerSummaries.map((summary) => (
          <Card
            key={`${summary.reviewerName}-${summary.sourceLabel ?? 'summary'}`}
            className="winoe-report-avoid-break border-slate-200 bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {summary.reviewerName}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {formatDays(summary.dayIndexes)}
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900">
                {summary.score === null
                  ? 'Score pending'
                  : formatScoreOutOf100(summary.score)}
              </div>
            </div>

            {summary.summary ? (
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {summary.summary}
              </p>
            ) : null}

            {summary.strengths.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-950">
                  Key strengths
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {summary.strengths.map((strength) => (
                    <li key={strength}>- {strength}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary.concerns.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-950">
                  Areas to follow up
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {summary.concerns.map((concern) => (
                    <li key={concern}>- {concern}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-950">
                Linked artifacts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatCountLabel(summary.evidence.length, 'artifact')}
              </p>
              <div className="mt-2">
                <EvidenceList
                  evidence={summary.evidence}
                  emptyMessage="No linked artifacts were returned for this reviewer summary yet."
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
