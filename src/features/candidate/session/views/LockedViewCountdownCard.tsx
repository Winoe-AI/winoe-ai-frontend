import { formatDate, formatTime } from './lockedView.format';

type Props = {
  countdownLabel: string;
  countdownTargetAt: string | null;
  timezone: string | null;
  scheduledStartAt: string | null;
};

export function LockedViewCountdownCard({
  countdownLabel,
  countdownTargetAt,
  timezone,
  scheduledStartAt,
}: Props) {
  return (
    <div className="rounded-md border border-wheat-100 bg-wheat-50 p-4 text-wheat-900">
      <p className="text-sm">
        Starts in <span className="font-semibold">{countdownLabel}</span>
      </p>
      {countdownTargetAt && timezone ? (
        <p className="mt-1 text-xs text-wheat-700">
          Your Trial opens on {formatDate(countdownTargetAt, timezone)} at{' '}
          {formatTime(countdownTargetAt, timezone)} {timezone}. Come back then.
        </p>
      ) : scheduledStartAt && timezone ? (
        <p className="mt-1 text-xs text-wheat-700">
          Your Trial opens on {formatDate(scheduledStartAt, timezone)} at{' '}
          {formatTime(scheduledStartAt, timezone)} {timezone}. Come back then.
        </p>
      ) : null}
    </div>
  );
}
