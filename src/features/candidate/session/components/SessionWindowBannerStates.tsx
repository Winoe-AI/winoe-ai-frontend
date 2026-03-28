import {
  formatLocalDateTime,
  formatLocalTime,
  type DerivedWindowState,
} from '../lib/windowState';

type SessionWindowOpenBannerProps = {
  windowState: DerivedWindowState;
};

export function SessionWindowOpenBanner({
  windowState,
}: SessionWindowOpenBannerProps) {
  const closeTime = formatLocalTime(windowState.windowEndAt);
  const closeAt = formatLocalDateTime(windowState.windowEndAt);

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
      <p className="text-sm font-semibold">
        Day {windowState.dayIndex} open
        {closeTime ? ` until ${closeTime}` : ''}
      </p>
      {closeAt ? <p className="mt-1 text-xs">Closes {closeAt}</p> : null}
    </div>
  );
}

export function SessionWindowClosedBeforeStartBanner({
  windowState,
}: SessionWindowOpenBannerProps) {
  const openAt = formatLocalDateTime(
    windowState.countdownTargetAt ?? windowState.windowStartAt,
  );
  const comeBackAt = formatLocalDateTime(windowState.actionGate.comeBackAt);

  return (
    <div
      aria-live="polite"
      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
    >
      <p className="text-sm font-semibold">
        Day {windowState.dayIndex} is not open yet
      </p>
      {openAt ? (
        <p className="mt-1 text-xs">Opens {openAt}</p>
      ) : (
        <p className="mt-1 text-xs">
          This day is outside the active window. Please return when it opens.
        </p>
      )}
      {windowState.countdownLabel ? (
        <p className="mt-1 text-xs">Starts in {windowState.countdownLabel}</p>
      ) : null}
      {windowState.correctedByBackend && comeBackAt ? (
        <p className="mt-2 rounded border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium">
          Come back at {comeBackAt}
        </p>
      ) : null}
    </div>
  );
}
