import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';
import Button from '@/shared/ui/Button';
import { LockedViewCountdownCard } from './LockedViewCountdownCard';
import { LockedViewDayWindows } from './LockedViewDayWindows';

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
        <h1 className="text-lg font-semibold">Trial locked until start</h1>
        <p className="mt-1 text-sm text-gray-600">
          {title || 'Your Trial'}
          {role ? ` (${role})` : ''} opens when Day 1 starts. Come back at the
          scheduled opening time.
        </p>
      </div>

      <LockedViewCountdownCard
        countdownLabel={countdownLabel}
        countdownTargetAt={countdownTargetAt}
        timezone={timezone}
        scheduledStartAt={scheduledStartAt}
      />

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
          <button className="ml-2 underline" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      <LockedViewDayWindows
        dayWindows={dayWindows}
        timezone={timezone}
        currentDayWindow={currentDayWindow}
      />

      <Button variant="secondary" onClick={onRetry}>
        Refresh
      </Button>
    </div>
  );
}
