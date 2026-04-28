'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCandidateCompletedReview,
  type CandidateCompletedReviewResponse,
  type CandidateReviewDayArtifact,
  type CandidateReviewPresentationArtifact,
  type CandidateReviewTranscriptSegment,
  type CandidateReviewWorkspaceArtifact,
} from '@/features/candidate/session/api';
import { buildLoginHref } from '@/features/auth/authPaths';
import { formatDateTime } from '@/shared/formatters';
import { MarkdownPreview } from '@/shared/ui/Markdown';
import Button from '@/shared/ui/Button';
import { queryKeys } from '@/shared/query';
import { toUserMessage } from '@/platform/errors/errors';

type Props = {
  token: string;
};

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
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
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
        <div>
          <div className="text-sm font-medium text-slate-500">Trial</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {review.trial.title}
          </div>
          <div className="mt-1 text-sm text-slate-600">{review.trial.role}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onDashboard}>
            Back to Candidate Dashboard
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="font-medium text-slate-500">Completed</dt>
          <dd className="mt-1 text-slate-900">
            {formatDateTime(review.completedAt) ?? review.completedAt}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="font-medium text-slate-500">Status</dt>
          <dd className="mt-1 text-slate-900">{review.status}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="font-medium text-slate-500">Candidate timezone</dt>
          <dd className="mt-1 text-slate-900">
            {review.candidateTimezone || 'Unavailable'}
          </dd>
        </div>
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

function ReviewArtifactCard({
  artifact,
}: {
  artifact: CandidateReviewDayArtifact;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Day {artifact.dayIndex}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {artifact.title}
          </h2>
          <div className="mt-1 text-sm text-slate-600">
            Submitted{' '}
            {formatDateTime(artifact.submittedAt) ?? artifact.submittedAt}
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {artifact.kind}
        </div>
      </div>

      <div className="mt-5">
        {artifact.kind === 'markdown' ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <MarkdownPreview
              content={artifact.markdown ?? ''}
              emptyPlaceholder="No markdown content was captured for this day."
            />
          </div>
        ) : artifact.kind === 'workspace' ? (
          <WorkspaceArtifact artifact={artifact} />
        ) : (
          <PresentationArtifact artifact={artifact} />
        )}
      </div>
    </section>
  );
}

function WorkspaceArtifact({
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
        <SummaryTile label="Commit" value={artifact.commitSha} />
        <SummaryTile label="Cutoff commit" value={artifact.cutoffCommitSha} />
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

      {artifact.testResults ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Test results</div>
          <dl className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <SummaryTile
              label="Passed"
              value={toDisplayValue(artifact.testResults.passed)}
            />
            <SummaryTile
              label="Failed"
              value={toDisplayValue(artifact.testResults.failed)}
            />
            <SummaryTile
              label="Total"
              value={toDisplayValue(artifact.testResults.total)}
            />
          </dl>
          {artifact.testResults.stdout ? (
            <OutputBlock title="Stdout" content={artifact.testResults.stdout} />
          ) : null}
          {artifact.testResults.stderr ? (
            <OutputBlock title="Stderr" content={artifact.testResults.stderr} />
          ) : null}
        </div>
      ) : null}

      {diffSummaryText ? (
        <OutputBlock title="Diff summary" content={diffSummaryText} />
      ) : null}
    </div>
  );
}

function PresentationArtifact({
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
          Recording playback is not available for this submission.
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
            Transcript content is not available yet.
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

  if (reviewQuery.isLoading) {
    return (
      <ReviewShell
        title="Loading completed review"
        description="Fetching your completed trial artifacts."
      />
    );
  }

  if (reviewQuery.error || !reviewQuery.data) {
    return (
      <ReviewShell
        title="Completed review unavailable"
        description={toUserMessage(
          reviewQuery.error,
          'Unable to load your completed trial review.',
        )}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.replace(loginHref)}>
              Sign in again
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/candidate/dashboard')}
            >
              Back to Candidate Dashboard
            </Button>
          </div>
        </div>
      </ReviewShell>
    );
  }

  return (
    <ReviewShell
      title="Completed trial review"
      description="Review the submitted artifacts and cutoff evidence for each day of your completed trial."
    >
      <ReviewMetadata
        review={reviewQuery.data}
        onDashboard={() => router.push('/candidate/dashboard')}
      />
      <div className="grid gap-6">
        {reviewQuery.data.artifacts.map((artifact) => (
          <ReviewArtifactCard
            key={`${artifact.dayIndex}-${artifact.taskId}-${artifact.kind}`}
            artifact={artifact}
          />
        ))}
      </div>
    </ReviewShell>
  );
}
