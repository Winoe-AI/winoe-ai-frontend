import { formatLocalDateTime, type DerivedWindowState } from '../lib/windowState';

type SessionWindowClosedBannerProps = {
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

export function SessionWindowClosedBanner({
  windowState,
  lastDraftSavedAt,
  lastSubmissionAt,
  lastSubmissionId,
}: SessionWindowClosedBannerProps) {
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
