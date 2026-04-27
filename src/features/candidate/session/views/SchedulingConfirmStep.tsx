import Button from '@/shared/ui/Button';
import type { SchedulingViewProps } from './SchedulingView.types';
import {
  formatScheduleDate,
  formatScheduleTime,
  formatScheduleTimeRange,
  SCHEDULE_DAY_LABELS,
} from './SchedulingView.format';

type SchedulingConfirmStepProps = Pick<
  SchedulingViewProps,
  | 'step'
  | 'scheduleTimezone'
  | 'scheduleGithubUsername'
  | 'schedulePreviewWindows'
  | 'onScheduleBack'
  | 'onScheduleConfirm'
>;

export function SchedulingConfirmStep({
  step,
  scheduleTimezone,
  scheduleGithubUsername,
  schedulePreviewWindows,
  onScheduleBack,
  onScheduleConfirm,
}: SchedulingConfirmStepProps) {
  const firstWindow = schedulePreviewWindows[0] ?? null;
  const timezone = scheduleTimezone.trim();
  const githubUsername = scheduleGithubUsername?.trim() ?? '';

  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-4">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <p>
          Your Trial opens on{' '}
          <span className="font-semibold">
            {firstWindow && timezone
              ? formatScheduleDate(firstWindow.windowStartAt, timezone)
              : 'your selected date'}
          </span>{' '}
          at{' '}
          <span className="font-semibold">
            {firstWindow && timezone
              ? `${formatScheduleTime(firstWindow.windowStartAt, timezone)} ${timezone}`
              : '9:00 AM in your timezone'}
          </span>
          .
        </p>
        <p className="mt-2">
          Trial content unlocks only when Day 1 opens. Confirm this schedule
          before the Talent Partner is notified.
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-700">
          GitHub username:{' '}
          <span className="font-semibold">{githubUsername || 'not set'}</span>
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          5-day schedule preview
        </h2>
        <ul className="mt-2 space-y-2">
          {schedulePreviewWindows.map((window) => (
            <li
              key={window.dayIndex}
              className="rounded-md border border-gray-200 p-3 text-sm"
            >
              <div className="font-medium">
                Day {window.dayIndex} —{' '}
                {SCHEDULE_DAY_LABELS[window.dayIndex] ?? 'Trial work'}
              </div>
              <div className="text-gray-700">
                {timezone
                  ? formatScheduleDate(window.windowStartAt, timezone)
                  : window.windowStartAt}
              </div>
              <div className="text-gray-600">
                {timezone
                  ? formatScheduleTimeRange(
                      window.windowStartAt,
                      window.windowEndAt,
                      timezone,
                    )
                  : '9:00 AM - 5:00 PM'}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-3 pt-1">
        <Button
          variant="secondary"
          disabled={step === 'submitting'}
          onClick={onScheduleBack}
        >
          Back
        </Button>
        <Button loading={step === 'submitting'} onClick={onScheduleConfirm}>
          Confirm schedule
        </Button>
      </div>
    </div>
  );
}
