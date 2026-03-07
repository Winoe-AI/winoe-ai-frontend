import {
  formatLocalDateTime,
  formatLocalTime,
  type DerivedWindowState,
} from '../lib/windowState';

type Props = {
  windowState: DerivedWindowState;
  lastDraftSavedAt: number | null;
  lastSubmissionAt: string | null;
  lastSubmissionId: number | null;
};

function formatDraftSavedAt(value: number | null): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function SessionWindowBanner({
  windowState,
  lastDraftSavedAt,
  lastSubmissionAt,
  lastSubmissionId,
}: Props) {
  if (windowState.phase === 'unknown' || windowState.dayIndex === null)
    return null;

  if (windowState.phase === 'open') {
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

  if (windowState.phase === 'closed_before_start') {
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

  const submissionAt = formatLocalDateTime(lastSubmissionAt);
  const draftSavedAt = formatDraftSavedAt(lastDraftSavedAt);
  const submissionHref = lastSubmissionId
    ? `/api/submissions/${encodeURIComponent(String(lastSubmissionId))}`
    : null;

  return (
    <div className="rounded-md border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900">
      <p className="text-sm font-semibold">Day closed</p>
      <p className="mt-1 text-xs">
        This day is now read-only. You can review what you already wrote, but
        workspace init, test runs, and submissions are locked.
      </p>
      {submissionAt ? (
        <p className="mt-2 text-xs font-medium">
          Submission recorded {submissionAt}
          {lastSubmissionId ? ` (ID #${lastSubmissionId})` : ''}.
        </p>
      ) : draftSavedAt ? (
        <p className="mt-2 text-xs font-medium">Draft saved {draftSavedAt}.</p>
      ) : null}
      {submissionHref ? (
        <p className="mt-1 text-xs">
          <a className="text-blue-700 underline" href={submissionHref}>
            View recorded submission
          </a>
        </p>
      ) : null}
      {windowState.correctedByBackend && windowState.backendDetail ? (
        <p className="mt-2 text-xs">{windowState.backendDetail}</p>
      ) : null}
    </div>
  );
}
