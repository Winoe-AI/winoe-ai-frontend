import Button from '@/shared/ui/Button';
import { formatShortDate } from '@/shared/formatters';
import {
  TECH_TRIAL_DAY_SUMMARY,
  TRIAL_COMPLETION_COPY,
  TRIAL_COMPLETION_DETAIL,
} from './completeView.copy';

type CompleteViewProps = {
  title: string;
  company: string | null;
  completedAt: string | null;
  onReview: () => void;
  onDashboard: () => void;
};

export function CompleteView({
  title,
  company,
  completedAt,
  onReview,
  onDashboard,
}: CompleteViewProps) {
  const completionDate = formatShortDate(completedAt) ?? 'Unavailable';
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Trial complete
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-950">
          {TRIAL_COMPLETION_COPY}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">
          {TRIAL_COMPLETION_DETAIL}
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetaTile label="Trial" value={title} />
          <MetaTile label="Company" value={company ?? 'Unavailable'} />
          <MetaTile label="Completion date" value={completionDate} />
        </dl>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">
          5-day Trial summary
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {TECH_TRIAL_DAY_SUMMARY.map((summary) => (
            <li
              key={summary}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800"
            >
              {summary}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onReview}>Review submissions</Button>
        <Button variant="secondary" onClick={onDashboard}>
          Back to Candidate Dashboard
        </Button>
      </div>
    </div>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white/80 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-gray-950">{value}</dd>
    </div>
  );
}
