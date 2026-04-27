import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import type { SchedulingViewProps } from './SchedulingView.types';
import {
  formatScheduleDate,
  formatScheduleTime,
  SCHEDULE_DAY_LABELS,
} from './SchedulingView.format';

type SchedulingFormStepProps = Pick<
  SchedulingViewProps,
  | 'scheduleDate'
  | 'scheduleTimezone'
  | 'scheduleGithubUsername'
  | 'scheduleTimezoneDetected'
  | 'scheduleTimezoneOptions'
  | 'scheduleDateError'
  | 'scheduleTimezoneError'
  | 'scheduleGithubUsernameError'
  | 'schedulePreviewWindows'
  | 'scheduleCanContinue'
  | 'onScheduleDateChange'
  | 'onScheduleTimezoneChange'
  | 'onScheduleGithubUsernameChange'
  | 'onScheduleContinue'
  | 'onDashboard'
>;

export function SchedulingFormStep({
  scheduleDate,
  scheduleTimezone,
  scheduleGithubUsername,
  scheduleTimezoneDetected,
  scheduleTimezoneOptions,
  scheduleDateError,
  scheduleTimezoneError,
  scheduleGithubUsernameError,
  schedulePreviewWindows,
  scheduleCanContinue,
  onScheduleDateChange,
  onScheduleTimezoneChange,
  onScheduleGithubUsernameChange,
  onScheduleContinue,
  onDashboard,
}: SchedulingFormStepProps) {
  const timezone = scheduleTimezone.trim();
  const firstWindow = schedulePreviewWindows[0] ?? null;
  const dateErrorId = scheduleDateError ? 'schedule-date-error' : undefined;
  const timezoneErrorId = scheduleTimezoneError
    ? 'schedule-timezone-error'
    : undefined;
  const githubErrorId = scheduleGithubUsernameError
    ? 'schedule-github-error'
    : undefined;

  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-4">
      <div>
        <label
          className="block text-sm font-medium text-gray-800"
          htmlFor="schedule-start-date"
        >
          Start date
        </label>
        <Input
          id="schedule-start-date"
          type="date"
          value={scheduleDate}
          onChange={(event) => onScheduleDateChange(event.target.value)}
          aria-label="Start date"
          aria-invalid={Boolean(scheduleDateError)}
          aria-describedby={dateErrorId}
        />
      </div>
      {scheduleDateError ? (
        <p id="schedule-date-error" className="text-sm text-red-700">
          {scheduleDateError}
        </p>
      ) : null}

      <div>
        <label
          className="block text-sm font-medium text-gray-800"
          htmlFor="schedule-timezone"
        >
          Timezone
        </label>
        <Input
          id="schedule-timezone"
          type="text"
          value={scheduleTimezone}
          list="candidate-timezone-list"
          onChange={(event) => onScheduleTimezoneChange(event.target.value)}
          placeholder="America/New_York"
          aria-label="Timezone"
          aria-invalid={Boolean(scheduleTimezoneError)}
          aria-describedby={timezoneErrorId}
        />
      </div>
      <datalist id="candidate-timezone-list">
        {scheduleTimezoneOptions.map((timezoneOption) => (
          <option key={timezoneOption} value={timezoneOption} />
        ))}
      </datalist>
      {scheduleTimezoneDetected ? (
        <p className="text-xs text-gray-500">
          Detected timezone: {scheduleTimezoneDetected}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          We could not detect your timezone. UTC is selected as a safe fallback;
          change it if needed.
        </p>
      )}
      {scheduleTimezoneError ? (
        <p id="schedule-timezone-error" className="text-sm text-red-700">
          {scheduleTimezoneError}
        </p>
      ) : null}

      <div>
        <label
          className="block text-sm font-medium text-gray-800"
          htmlFor="schedule-github-username"
        >
          GitHub username
        </label>
        <Input
          id="schedule-github-username"
          type="text"
          value={scheduleGithubUsername}
          onChange={(event) =>
            onScheduleGithubUsernameChange(event.target.value)
          }
          placeholder="octocat"
          aria-label="GitHub username"
          aria-invalid={Boolean(scheduleGithubUsernameError)}
          aria-describedby={githubErrorId}
        />
      </div>
      <p className="text-xs text-gray-500">
        Use the GitHub username connected to your Trial workspace.
      </p>
      {scheduleGithubUsernameError ? (
        <p id="schedule-github-error" className="text-sm text-red-700">
          {scheduleGithubUsernameError}
        </p>
      ) : null}

      {firstWindow && timezone ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Your Trial opens on{' '}
          <span className="font-semibold">
            {formatScheduleDate(firstWindow.windowStartAt, timezone)}
          </span>{' '}
          at{' '}
          <span className="font-semibold">
            {formatScheduleTime(firstWindow.windowStartAt, timezone)} {timezone}
          </span>
          .
        </div>
      ) : null}

      {schedulePreviewWindows.length > 0 && timezone ? (
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
                  {formatScheduleDate(window.windowStartAt, timezone)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onDashboard}>
          Back to dashboard
        </Button>
        <Button disabled={!scheduleCanContinue} onClick={onScheduleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
