import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import type { CandidateDayWindow } from '@/features/candidate/api';
import { AiNoticeCard } from '../components/AiNoticeCard';

type Props = {
  title: string;
  role: string;
  step: 'form' | 'confirm' | 'submitting';
  scheduleDate: string;
  scheduleTimezone: string;
  scheduleTimezoneDetected: string | null;
  scheduleTimezoneOptions: string[];
  scheduleDateError: string | null;
  scheduleTimezoneError: string | null;
  scheduleSubmitError: string | null;
  schedulePreviewWindows: CandidateDayWindow[];
  onScheduleDateChange: (value: string) => void;
  onScheduleTimezoneChange: (value: string) => void;
  onScheduleContinue: () => void;
  onScheduleBack: () => void;
  onScheduleConfirm: () => void;
  onScheduleRetry: () => void;
  onDashboard: () => void;
};

function formatDate(iso: string, timezone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function formatTimeRange(
  startIso: string,
  endIso: string,
  timezone: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return '9:00 AM - 5:00 PM';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function SchedulingView({
  title,
  role,
  step,
  scheduleDate,
  scheduleTimezone,
  scheduleTimezoneDetected,
  scheduleTimezoneOptions,
  scheduleDateError,
  scheduleTimezoneError,
  scheduleSubmitError,
  schedulePreviewWindows,
  onScheduleDateChange,
  onScheduleTimezoneChange,
  onScheduleContinue,
  onScheduleBack,
  onScheduleConfirm,
  onScheduleRetry,
  onDashboard,
}: Props) {
  const firstWindow = schedulePreviewWindows[0] ?? null;
  const timezone = scheduleTimezone.trim();
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-lg font-semibold">Pick your start date</h1>
        <p className="mt-1 text-sm text-gray-600">
          Confirm your local schedule before starting{' '}
          {title || 'your simulation'}
          {role ? ` (${role})` : ''}.
        </p>
      </div>

      <AiNoticeCard compact />

      {scheduleSubmitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {scheduleSubmitError}
          <button className="ml-2 underline" onClick={onScheduleRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {step === 'form' ? (
        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-800">
            Start date
          </label>
          <Input
            type="date"
            value={scheduleDate}
            onChange={(event) => onScheduleDateChange(event.target.value)}
            aria-label="Start date"
          />
          {scheduleDateError ? (
            <p className="text-sm text-red-700">{scheduleDateError}</p>
          ) : null}

          <label className="block text-sm font-medium text-gray-800">
            Timezone (IANA)
          </label>
          <Input
            type="text"
            value={scheduleTimezone}
            list="candidate-timezone-list"
            onChange={(event) => onScheduleTimezoneChange(event.target.value)}
            placeholder="America/New_York"
            aria-label="Timezone"
          />
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
              We could not detect your timezone. Enter it manually.
            </p>
          )}
          {scheduleTimezoneError ? (
            <p className="text-sm text-red-700">{scheduleTimezoneError}</p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onDashboard}>
              Back to dashboard
            </Button>
            <Button onClick={onScheduleContinue}>Continue</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p>
              Starts on{' '}
              <span className="font-semibold">
                {firstWindow && timezone
                  ? formatDate(firstWindow.windowStartAt, timezone)
                  : 'your selected date'}
              </span>{' '}
              at <span className="font-semibold">9:00 AM (Your time)</span>.
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
                  <div className="font-medium">Day {window.dayIndex}</div>
                  <div className="text-gray-700">
                    {timezone
                      ? formatDate(window.windowStartAt, timezone)
                      : window.windowStartAt}
                  </div>
                  <div className="text-gray-600">
                    {timezone
                      ? formatTimeRange(
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
            <Button variant="secondary" onClick={onScheduleBack}>
              Back
            </Button>
            <Button loading={step === 'submitting'} onClick={onScheduleConfirm}>
              Confirm schedule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
