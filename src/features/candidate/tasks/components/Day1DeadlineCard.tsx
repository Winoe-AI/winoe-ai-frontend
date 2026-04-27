'use client';

import { useCallback, useMemo } from 'react';
import { useCountdownTicker } from '@/shared/hooks/useCountdownTicker';

type Day1DeadlineCardProps = {
  cutoffAt?: string | null;
  isClosed: boolean;
};

const deadlineFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function Day1DeadlineCard({
  cutoffAt,
  isClosed,
}: Day1DeadlineCardProps) {
  const cutoffMs = useMemo(() => {
    if (!cutoffAt) return null;
    const parsed = Date.parse(cutoffAt);
    return Number.isFinite(parsed) ? parsed : null;
  }, [cutoffAt]);
  const isActive = useCallback(
    () => Boolean(cutoffMs && !isClosed && Date.now() < cutoffMs),
    [cutoffMs, isClosed],
  );
  const now = useCountdownTicker(isActive, 1000);

  if (!cutoffMs) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Day 1 deadline is unavailable. Winoe AI cannot confirm the 5 PM closing
        time for this Trial.
      </div>
    );
  }

  const remainingMs = cutoffMs - now;
  const closed = isClosed || remainingMs <= 0;

  return (
    <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
            Day 1 deadline
          </p>
          <p className="mt-1 text-sm text-blue-950">
            5 PM deadline: {deadlineFormatter.format(new Date(cutoffMs))}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium text-blue-800">
            {closed ? 'Closed' : 'Time remaining'}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-blue-950">
            {closed ? 'Day 1 closed' : formatRemaining(remainingMs)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-blue-900">
        When the deadline arrives, Winoe AI saves the latest Day 1 design
        document draft and locks editing for the Evidence Trail.
      </p>
    </div>
  );
}
