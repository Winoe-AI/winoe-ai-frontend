import Button from '@/shared/ui/Button';
import {
  TECH_TRIAL_DAY_SUMMARY,
  TRIAL_COMPLETION_COPY,
  TRIAL_COMPLETION_DETAIL,
} from '@/features/candidate/session/views/completeView.copy';

type Props = {
  onReview?: () => void;
  onDashboard?: () => void;
};

export function Day5ReflectionCompletionView({ onReview, onDashboard }: Props) {
  return (
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Congratulations
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-gray-950">
        {TRIAL_COMPLETION_COPY}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">
        {TRIAL_COMPLETION_DETAIL}
      </p>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-950">
          Completed 5-day Trial
        </p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {TECH_TRIAL_DAY_SUMMARY.map((day) => (
            <li
              key={day}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
            >
              {day}
            </li>
          ))}
        </ol>
      </div>

      {onReview || onDashboard ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {onReview ? (
            <Button onClick={onReview}>Review submissions</Button>
          ) : null}
          {onDashboard ? (
            <Button variant="secondary" onClick={onDashboard}>
              Back to Candidate Dashboard
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
