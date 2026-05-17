'use client';

import type { SubmissionReviewCommit } from '../../api';

type Props = {
  commits: SubmissionReviewCommit[];
  selectedSha: string | null;
  onSelect: (sha: string | null) => void;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function SubmissionReviewCommitTimeline({
  commits,
  selectedSha,
  onSelect,
}: Props) {
  if (commits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-subtle bg-secondary p-4 text-sm text-secondary">
        No commit timeline is available for this day yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commits.map((commit) => {
        const active = commit.sha === selectedSha;
        return (
          <button
            key={commit.sha}
            type="button"
            onClick={() => onSelect(active ? null : commit.sha)}
            className={[
              'w-full rounded-2xl border p-3 text-left transition',
              active
                ? 'border-wheat-300 bg-wheat-50'
                : 'border-subtle bg-elevated hover:bg-secondary',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">
                  {commit.sha.slice(0, 7)}
                </p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {commit.message}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-secondary">
                <p>{formatDateTime(commit.timestamp)}</p>
                <p className="mt-1">
                  {typeof commit.filesChanged === 'number'
                    ? `${commit.filesChanged} file${commit.filesChanged === 1 ? '' : 's'} changed`
                    : 'Files changed unavailable'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
