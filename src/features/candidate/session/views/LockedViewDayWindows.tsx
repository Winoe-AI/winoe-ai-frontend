import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';
import { SCHEDULE_DAY_LABELS } from './SchedulingView.format';
import { formatDate, formatTime } from './lockedView.format';

type Props = {
  dayWindows: CandidateDayWindow[];
  timezone: string | null;
  currentDayWindow: CandidateCurrentDayWindow | null;
};

export function LockedViewDayWindows({
  dayWindows,
  timezone,
  currentDayWindow,
}: Props) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        5-day schedule preview
      </h2>
      <ul className="mt-2 space-y-2">
        {dayWindows.map((window) => (
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
  );
}
