'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCandidateCompletedReview,
  type CandidateCompletedReviewResponse,
  type CandidateReviewCommitHistoryEntry,
  type CandidateReviewDayArtifact,
  type CandidateReviewMarkdownArtifact,
  type CandidateReviewPresentationArtifact,
  type CandidateReviewTranscriptSegment,
  type CandidateReviewWorkspaceArtifact,
} from '@/features/candidate/session/api';
import { buildLoginHref } from '@/features/auth/authPaths';
import { formatDateTime, formatShortDate } from '@/shared/formatters';
import Button from '@/shared/ui/Button';
import { MarkdownPreview } from '@/shared/ui/Markdown';
import { queryKeys } from '@/shared/query';
import { toUserMessage } from '@/platform/errors/errors';

type Props = {
  token: string;
};

type ReviewDayConfig = {
  dayIndex: number;
  label: string;
  emptyMessage: string;
};

const REVIEW_DAYS: ReviewDayConfig[] = [
  {
    dayIndex: 1,
    label: 'Day 1 — Design Doc',
    emptyMessage: 'No design doc content was captured for this day.',
  },
  {
    dayIndex: 2,
    label: 'Day 2 — Implementation Kickoff',
    emptyMessage: 'No submission was captured for this day.',
  },
  {
    dayIndex: 3,
    label: 'Day 3 — Implementation Wrap-Up',
    emptyMessage: 'No submission was captured for this day.',
  },
  {
    dayIndex: 4,
    label: 'Day 4 — Handoff + Demo',
    emptyMessage: 'No handoff + demo submission was captured for this day.',
  },
  {
    dayIndex: 5,
    label: 'Day 5 — Reflection Essay',
    emptyMessage: 'No reflection essay content was captured for this day.',
  },
];

function ReviewShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Read-only review
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ReviewMetadata({
  review,
  onDashboard,
}: {
  review: CandidateCompletedReviewResponse;
  onDashboard: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-500">Trial</div>
          <div className="text-2xl font-semibold text-slate-950">
            {review.trial.title}
          </div>
          <div className="text-sm text-slate-600">
            {review.trial.company ?? 'Company unavailable'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onDashboard}>
            Back to Candidate Dashboard
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 text-sm text-slate-700 md:grid-cols-4">
        <MetaTile
          label="Completion date"
          value={formatShortDate(review.completedAt) ?? review.completedAt}
        />
        <MetaTile label="Candidate timezone" value={review.candidateTimezone} />
        <MetaTile label="Status" value={review.status} />
        <MetaTile
          label="Review mode"
          value="Read-only. Submission artifacts only."
        />
      </dl>

      {review.dayWindows?.length ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">
            Submission windows
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {review.dayWindows.map((window) => (
              <div
                key={`day-window-${window.dayIndex}`}
                className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-900">
                  Day {window.dayIndex}
                </div>
                <div className="mt-1">
                  Opens:{' '}
                  {formatDateTime(window.windowStartAt) ?? window.windowStartAt}
                </div>
                <div className="mt-1">
                  Closes:{' '}
                  {formatDateTime(window.windowEndAt) ?? window.windowEndAt}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewDayCard({
  day,
  artifact,
}: {
  day: ReviewDayConfig;
  artifact: CandidateReviewDayArtifact | null;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{day.label}</div>
          {artifact ? (
            <>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {artifact.title || day.label}
              </h2>
              <div className="mt-1 text-sm text-slate-600">
                Submitted{' '}
                {toDisplayValue(
                  formatDateTime(artifact.submittedAt) ?? artifact.submittedAt,
                )}
              </div>
            </>
          ) : null}
        </div>
        {artifact ? (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            Day {artifact.dayIndex}
          </div>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            Empty
          </div>
        )}
      </div>

      <div className="mt-5">
        {!artifact ? (
          <EmptyDayState message={day.emptyMessage} />
        ) : artifact.kind === 'markdown' ? (
          <MarkdownDayArtifact
            artifact={artifact}
            emptyMessage={day.emptyMessage}
          />
        ) : artifact.kind === 'workspace' ? (
          <WorkspaceDayArtifact artifact={artifact} />
        ) : (
          <PresentationDayArtifact artifact={artifact} />
        )}
      </div>
    </section>
  );
}

function EmptyDayState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {message}
    </div>
  );
}

function MarkdownDayArtifact({
  artifact,
  emptyMessage,
}: {
  artifact: CandidateReviewMarkdownArtifact;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <MarkdownPreview
        content={artifact.markdown ?? ''}
        emptyPlaceholder={emptyMessage}
      />
    </div>
  );
}

function WorkspaceDayArtifact({
  artifact,
}: {
  artifact: CandidateReviewWorkspaceArtifact;
}) {
  const diffSummaryText =
    typeof artifact.diffSummary === 'string'
      ? artifact.diffSummary
      : artifact.diffSummary
        ? JSON.stringify(artifact.diffSummary, null, 2)
        : null;

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <SummaryTile label="Repository" value={artifact.repoFullName} />
        <SummaryTile label="Commit SHA" value={artifact.commitSha} />
        <SummaryTile
          label="Cutoff commit SHA"
          value={artifact.cutoffCommitSha}
        />
        <SummaryTile
          label="Cutoff time"
          value={formatDateTime(artifact.cutoffAt) ?? artifact.cutoffAt ?? null}
        />
      </dl>

      <div className="flex flex-wrap gap-2">
        <ArtifactLink href={artifact.commitUrl} label="Open commit" />
        <ArtifactLink href={artifact.workflowUrl} label="Open workflow run" />
        <ArtifactLink href={artifact.diffUrl} label="Open diff summary" />
      </div>

      <CommitHistorySection commitHistory={artifact.commitHistory ?? null} />

      <TestResultsSection testResults={artifact.testResults ?? null} />

      {diffSummaryText ? (
        <OutputBlock title="Diff summary" content={diffSummaryText} />
      ) : null}
    </div>
  );
}

function CommitHistorySection({
  commitHistory,
}: {
  commitHistory: CandidateReviewCommitHistoryEntry[] | null;
}) {
  if (!commitHistory?.length) {
    return (
      <UnavailableArtifactSection
        title="Commit history"
        message="Commit history is unavailable for this day."
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">Commit history</div>
      <div className="mt-3 space-y-2">
        {commitHistory.map((entry, index) => (
          <div
            key={`commit-${index}-${entry?.sha ?? 'unknown'}`}
            className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-950">
                {entry?.sha ?? 'Commit unavailable'}
              </span>
              {entry?.url ? (
                <ArtifactLink href={entry.url} label="Open commit" />
              ) : null}
            </div>
            {entry?.message ? (
              <div className="mt-1 whitespace-pre-wrap">{entry.message}</div>
            ) : null}
            <div className="mt-1 text-xs text-slate-500">
              {entry?.authorName
                ? `Author: ${entry.authorName}`
                : 'Author unavailable'}
              {entry?.committedAt
                ? ` • ${formatDateTime(entry.committedAt) ?? entry.committedAt}`
                : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestResultsSection({
  testResults,
}: {
  testResults: CandidateReviewWorkspaceArtifact['testResults'];
}) {
  if (!testResults) {
    return (
      <UnavailableArtifactSection
        title="Test results"
        message="Test results are unavailable for this day."
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">Test results</div>
      <dl className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <SummaryTile label="Passed" value={testResults.passed} />
        <SummaryTile label="Failed" value={testResults.failed} />
        <SummaryTile label="Total" value={testResults.total} />
      </dl>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SummaryTile label="Status" value={testResults.status} />
        <SummaryTile label="Conclusion" value={testResults.conclusion} />
        <SummaryTile label="Run status" value={testResults.runStatus} />
        <SummaryTile label="Workflow run" value={testResults.workflowRunId} />
      </div>
      {testResults.stdout ? (
        <OutputBlock title="Stdout" content={testResults.stdout} />
      ) : null}
      {testResults.stderr ? (
        <OutputBlock title="Stderr" content={testResults.stderr} />
      ) : null}
    </div>
  );
}

function UnavailableArtifactSection({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}

function PresentationDayArtifact({
  artifact,
}: {
  artifact: CandidateReviewPresentationArtifact;
}) {
  const transcriptSegments =
    artifact.transcript?.segments ??
    artifact.transcript?.segmentsJson ??
    ([] as CandidateReviewTranscriptSegment[]);

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <SummaryTile
          label="Recording status"
          value={artifact.recording?.status ?? 'Unavailable'}
        />
        <SummaryTile
          label="Transcript status"
          value={artifact.transcript?.status ?? 'Unavailable'}
        />
      </dl>

      {artifact.recording?.downloadUrl ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">
            Handoff + Demo recording
          </div>
          <video
            className="mt-3 w-full rounded-lg bg-black"
            controls
            preload="metadata"
            src={artifact.recording.downloadUrl}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Recording playback is unavailable for this submission.
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-900">Transcript</div>
        {transcriptSegments.length ? (
          <div className="mt-3 space-y-2">
            {transcriptSegments.map((segment, index) => (
              <div
                key={`segment-${index}-${segment.startMs}`}
                className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {formatSegmentRange(segment.startMs, segment.endMs)}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{segment.text}</div>
              </div>
            ))}
          </div>
        ) : artifact.transcript?.text ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {artifact.transcript.text}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Transcript unavailable or still processing.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-900">
        {toDisplayValue(value)}
      </dd>
    </div>
  );
}

function MetaTile({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">
        {toDisplayValue(value)}
      </dd>
    </div>
  );
}

function ArtifactLink({
  href,
  label,
}: {
  href?: string | null;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      {label}
    </a>
  );
}

function OutputBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-xs text-slate-100">
        {content}
      </pre>
    </div>
  );
}

function toDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '')
    return 'Unavailable';
  return String(value);
}

function formatSegmentRange(startMs: number, endMs: number) {
  const formatSeconds = (valueMs: number) => `${(valueMs / 1000).toFixed(1)}s`;
  return `${formatSeconds(startMs)} - ${formatSeconds(endMs)}`;
}

function ReviewUnavailableState({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <ReviewShell title={title} description={description}>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          {secondaryAction ? (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>
    </ReviewShell>
  );
}

export default function CandidateCompletedReviewPage({ token }: Props) {
  const router = useRouter();
  const loginHref = useMemo(
    () =>
      buildLoginHref(
        `/candidate/session/${encodeURIComponent(token)}/review`,
        'candidate',
      ),
    [token],
  );

  const reviewQuery = useQuery({
    queryKey: queryKeys.candidate.sessionReview(token),
    queryFn: ({ signal }) => getCandidateCompletedReview(token, { signal }),
    staleTime: 10_000,
  });

  const errorStatus = (reviewQuery.error as { status?: number } | null)?.status;

  useEffect(() => {
    if (errorStatus === 401 || errorStatus === 403) {
      router.replace(loginHref);
    }
  }, [errorStatus, loginHref, router]);

  const activeSessionHref = `/candidate/session/${encodeURIComponent(token)}`;

  if (reviewQuery.isLoading) {
    return (
      <ReviewShell
        title="Loading completed Trial review"
        description="Fetching your completed Trial submissions."
      />
    );
  }

  if (errorStatus === 409) {
    return (
      <ReviewUnavailableState
        title="Trial not complete yet"
        description="This Trial is not complete yet. Finish the active session before opening read-only review."
        primaryAction={{
          label: 'Back to Candidate Dashboard',
          onClick: () => router.push('/candidate/dashboard'),
        }}
        secondaryAction={{
          label: 'Return to active session',
          onClick: () => router.push(activeSessionHref),
        }}
      />
    );
  }

  if (reviewQuery.error || !reviewQuery.data) {
    const fallbackStatus = errorStatus ?? 500;
    return (
      <ReviewUnavailableState
        title="Completed Trial review unavailable"
        description={
          fallbackStatus >= 500
            ? 'The completed Trial review is temporarily unavailable. Please return to the dashboard and try again later.'
            : toUserMessage(
                reviewQuery.error,
                'Unable to load your completed Trial review.',
              )
        }
        primaryAction={{
          label: 'Back to Candidate Dashboard',
          onClick: () => router.push('/candidate/dashboard'),
        }}
        secondaryAction={{
          label: 'Reload review',
          onClick: () => router.refresh(),
        }}
      />
    );
  }

  const artifactsByDay = new Map<number, CandidateReviewDayArtifact>();
  for (const artifact of reviewQuery.data.artifacts) {
    artifactsByDay.set(artifact.dayIndex, artifact);
  }

  return (
    <ReviewShell
      title="Completed Trial review"
      description="Read-only view of the submissions captured during your 5-day Trial."
    >
      <ReviewMetadata
        review={reviewQuery.data}
        onDashboard={() => router.push('/candidate/dashboard')}
      />
      <div className="grid gap-6">
        {REVIEW_DAYS.map((day) => (
          <ReviewDayCard
            key={day.dayIndex}
            day={day}
            artifact={artifactsByDay.get(day.dayIndex) ?? null}
          />
        ))}
      </div>
    </ReviewShell>
  );
}
