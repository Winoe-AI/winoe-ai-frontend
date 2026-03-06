import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/api';
import Button from '@/shared/ui/Button';

type Props = {
  title: string;
  role: string;
  countdownLabel: string;
  countdownTargetAt: string | null;
  timezone: string | null;
  scheduledStartAt: string | null;
  dayWindows: CandidateDayWindow[];
  currentDayWindow: CandidateCurrentDayWindow | null;
  errorMessage: string | null;
  onRetry: () => void;
};

function formatDate(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatTime(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function LockedView({
  title,
  role,
  countdownLabel,
  countdownTargetAt,
  timezone,
  scheduledStartAt,
  dayWindows,
  currentDayWindow,
  errorMessage,
  onRetry,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold">Simulation locked until start</h1>
        <p className="mt-1 text-sm text-gray-600">
          {title || 'Your simulation'}
          {role ? ` (${role})` : ''} opens when Day 1 starts.
        </p>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          Starts in <span className="font-semibold">{countdownLabel}</span>
        </p>
        {countdownTargetAt && timezone ? (
          <p className="mt-1 text-xs text-blue-800">
            Opens on {formatDate(countdownTargetAt, timezone)} at{' '}
            {formatTime(countdownTargetAt, timezone)} ({timezone})
          </p>
        ) : scheduledStartAt && timezone ? (
          <p className="mt-1 text-xs text-blue-800">
            Opens on {formatDate(scheduledStartAt, timezone)} at{' '}
            {formatTime(scheduledStartAt, timezone)} ({timezone})
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
          <button className="ml-2 underline" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="rounded-md border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Day windows</h2>
        <ul className="mt-2 space-y-2">
          {dayWindows.map((window) => (
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
                  ? `${formatTime(window.windowStartAt, timezone)} - ${formatTime(
                      window.windowEndAt,
                      timezone,
                    )}`
                  : `${window.windowStartAt} - ${window.windowEndAt}`}
              </div>
            </li>
          ))}
        </ul>
        {currentDayWindow ? (
          <p className="mt-3 text-xs text-gray-600">
            Current window state: {currentDayWindow.state}
          </p>
        ) : null}
      </div>

      <Button variant="secondary" onClick={onRetry}>
        Refresh
      </Button>
    </div>
  );
}
