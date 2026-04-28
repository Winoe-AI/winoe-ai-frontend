import { useCallback } from 'react';
import { useCountdownTicker } from '@/shared/hooks/useCountdownTicker';
import {
  countdownFromUtc,
  formatCountdown,
} from '@/features/candidate/session/utils/scheduleUtils';
import {
  formatLocalDateTime,
  formatLocalTime,
} from '@/features/candidate/session/lib/windowState';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';
import type { Task } from '../types';

type Props = {
  task: Task;
  controller: HandoffUploadPanelController;
};

export function HandoffWindowStatus({ task, controller }: Props) {
  const cutoffAt = task.cutoffAt ?? null;
  const tickActive = useCallback(
    () => Boolean(cutoffAt && !controller.windowClosed),
    [cutoffAt, controller.windowClosed],
  );
  const nowMs = useCountdownTicker(tickActive, 1000);
  const countdown = countdownFromUtc(cutoffAt, nowMs);
  const cutoffTime = formatLocalTime(cutoffAt);
  const cutoffDateTime = formatLocalDateTime(cutoffAt);
  const isNearCutoff =
    countdown.totalMs > 0 && countdown.totalMs <= 30 * 60_000;

  if (controller.windowClosed) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {controller.windowClosedMessage} Day 4 Handoff + Demo uploads and
        resubmissions are available only during the scheduled window.
      </div>
    );
  }

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        isNearCutoff
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-blue-200 bg-blue-50 text-blue-900'
      }`}
      aria-live="polite"
    >
      <span className="font-semibold">Day 4 window: 9 AM - 5 PM local.</span>{' '}
      {cutoffAt ? (
        <>
          Uploads and resubmissions close
          {cutoffTime ? ` at ${cutoffTime}` : ''}.{' '}
          {!countdown.complete ? (
            <span>
              Time left:{' '}
              <span className="font-semibold">
                {formatCountdown(countdown)}
              </span>
            </span>
          ) : (
            <span>
              Cutoff reached. Refresh if this panel has not locked yet.
            </span>
          )}
        </>
      ) : (
        <span>
          The exact cutoff is not available from the schedule yet. The backend
          will enforce the Day 4 window.
        </span>
      )}
      {cutoffDateTime ? (
        <span className="sr-only">
          {' '}
          Cutoff date and time: {cutoffDateTime}.
        </span>
      ) : null}
    </div>
  );
}
