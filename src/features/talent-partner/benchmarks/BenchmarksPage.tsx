'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listTrials, type TrialListItem } from '../api';
import {
  getBenchmarks,
  type BenchmarkCandidate,
  type BenchmarksResponse,
  type BenchmarkStatus,
} from '../api/benchmarksApi';
import { Card } from '@/shared/ui/Card';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import { StatusPill } from '@/shared/ui/StatusPill';
import type { StatusPillTone } from '@/shared/status/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/Table';

type BenchmarksPageProps = {
  initialTrialId?: string | null;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: BenchmarksResponse }
  | { status: 'error'; code: number | null; message: string };

const STATUS_OPTIONS: Array<{ value: BenchmarkStatus | 'all'; label: string }> =
  [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'report_pending', label: 'Report Pending' },
    { value: 'evaluated', label: 'Evaluated' },
  ];

const TIME_OPTIONS = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function formatScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function statusLabel(status: BenchmarkCandidate['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'report_pending':
      return 'Report Pending';
    case 'evaluated':
      return 'Evaluated';
    default:
      return status;
  }
}

function statusTone(status: BenchmarkCandidate['status']): StatusPillTone {
  switch (status) {
    case 'evaluated':
      return 'success';
    case 'report_pending':
      return 'warning';
    case 'completed':
      return 'info';
    case 'in_progress':
    default:
      return 'muted';
  }
}

function cohortStatsLabel(value: number | null): string {
  if (value === null) return '—';
  return formatScore(value);
}

function CandidateAvatar({ name, email }: { name: string; email: string }) {
  const initials = (name || email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-wheat-200 bg-wheat-50 text-sm font-semibold text-wheat-900">
      {initials || 'TP'}
    </div>
  );
}

function DimensionBars({
  dimensions,
}: {
  dimensions: BenchmarkCandidate['dimensions'];
}) {
  if (!dimensions || dimensions.length === 0) {
    return <span className="text-sm text-secondary">—</span>;
  }

  return (
    <div className="flex items-end gap-1" aria-label="Dimension sparklines">
      {dimensions.slice(0, 6).map((dimension) => {
        const height = Math.max(8, Math.min(100, dimension.score * 10));
        return (
          <div
            key={dimension.name}
            title={`${dimension.name}: ${dimension.score}/10`}
            className="flex h-16 w-3 items-end justify-center"
          >
            <div
              className="w-full rounded-t-sm bg-wheat-500"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function CandidateSubmissionLink({
  trialId,
  candidateId,
}: {
  trialId: string;
  candidateId: string;
}) {
  return (
    <Link
      href={`/talent-partner/trials/${encodeURIComponent(trialId)}/candidates/${encodeURIComponent(candidateId)}/submission`}
      className="text-sm font-medium text-wheat-700 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      View submission
    </Link>
  );
}

function BenchmarksSummaryCard({ data }: { data: BenchmarksResponse }) {
  const sampleLabel = data.cohort.sufficient
    ? 'Sufficient sample size'
    : 'Limited sample';

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-primary">
              Cohort summary
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary">
              Same Trial. Same Winoe instance. Same rubric.
            </p>
          </div>
          <InlineBadge
            label={sampleLabel}
            tone={data.cohort.sufficient ? 'success' : 'warning'}
          />
        </div>

        <p className="max-w-3xl text-sm text-secondary">
          Benchmarks compare candidates who completed the same Trial under the
          same Calibration, so the comparison is apples-to-apples.
        </p>

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Candidates" value={String(data.cohort.n)} />
          <StatCard
            label="Median Winoe Score"
            value={cohortStatsLabel(data.cohort.median)}
          />
          <StatCard
            label="Mean Winoe Score"
            value={cohortStatsLabel(data.cohort.mean)}
          />
          <StatCard
            label="Score range"
            value={
              data.cohort.range
                ? `${formatScore(data.cohort.range[0])} - ${formatScore(data.cohort.range[1])}`
                : '—'
            }
          />
        </div>

        {!data.cohort.sufficient ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            With fewer than 3 candidates, comparison is informational rather
            than statistically meaningful.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-subtle bg-secondary p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
        {value}
      </p>
    </div>
  );
}

function EmptyBenchmarksCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="text-sm text-secondary">{message}</p>
      </div>
    </Card>
  );
}

function BenchmarksTable({
  trialId,
  data,
  selectedIds,
  onToggleCandidate,
  onRowOpen,
}: {
  trialId: string;
  data: BenchmarksResponse;
  selectedIds: Set<string>;
  onToggleCandidate: (
    candidate: BenchmarkCandidate,
    nextChecked: boolean,
  ) => void;
  onRowOpen: (candidate: BenchmarkCandidate) => void;
}) {
  const pageRows = data.candidates;

  if (pageRows.length === 0) {
    return (
      <EmptyBenchmarksCard
        title="No candidates are available for this Trial yet."
        message="Invite candidates or wait for the Trial roster to populate before comparing benchmark data."
      />
    );
  }

  const reportsPending =
    pageRows.length > 0 && pageRows.every((item) => !item.report_id);

  return (
    <div className="space-y-4">
      {reportsPending ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Candidates are available, but Winoe Reports are still being prepared.
        </div>
      ) : null}

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-subtle hover:bg-transparent">
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Winoe Score</TableHead>
              <TableHead>Dimension sparklines</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted at</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((candidate) => {
              const selected = selectedIds.has(candidate.id);
              const reportHref = candidate.report_id
                ? `/talent-partner/trials/${encodeURIComponent(trialId)}/candidates/${encodeURIComponent(candidate.id)}/winoe-report`
                : null;
              return (
                <TableRow
                  key={candidate.id}
                  className="cursor-pointer"
                  onClick={() => onRowOpen(candidate)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <input
                      aria-label={`Select ${candidate.name}`}
                      type="checkbox"
                      checked={selected}
                      onChange={(event) =>
                        onToggleCandidate(
                          candidate,
                          event.currentTarget.checked,
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CandidateAvatar
                        name={candidate.name}
                        email={candidate.email}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-primary">
                          {candidate.name}
                        </p>
                        <p className="truncate text-sm text-secondary">
                          {candidate.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-primary">
                      {candidate.trial_title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-primary">
                      {candidate.winoe_score === null
                        ? '—'
                        : formatScore(candidate.winoe_score)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DimensionBars dimensions={candidate.dimensions} />
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      label={statusLabel(candidate.status)}
                      tone={statusTone(candidate.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-secondary">
                      {formatDateTime(candidate.submitted_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {reportHref ? (
                        <Link
                          href={reportHref}
                          className="text-sm font-medium text-wheat-700 hover:underline"
                        >
                          View report
                        </Link>
                      ) : (
                        <span className="text-sm text-secondary">—</span>
                      )}
                      <CandidateSubmissionLink
                        trialId={trialId}
                        candidateId={candidate.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SelectedBar({
  count,
  onCancel,
  onCompare,
  disabled,
}: {
  count: number;
  onCancel: () => void;
  onCompare: () => void;
  disabled: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-subtle bg-elevated/95 px-4 py-4 shadow-[0_-14px_36px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3">
        <div className="text-sm text-primary">
          <span className="font-semibold">{count}</span> candidate
          {count === 1 ? '' : 's'} selected
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-subtle px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCompare}
            disabled={disabled}
            className="rounded-md bg-wheat-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Compare {count} candidates side-by-side
          </button>
        </div>
      </div>
    </div>
  );
}

function TrialSelector({
  trials,
  value,
  onChange,
  loading,
}: {
  trials: TrialListItem[];
  value: string | null;
  onChange: (next: string) => void;
  loading: boolean;
}) {
  return (
    <Card>
      <div className="space-y-3">
        <label
          className="block text-sm font-medium text-primary"
          htmlFor="benchmarks-trial"
        >
          Trial
        </label>
        <select
          id="benchmarks-trial"
          className="w-full rounded-md border border-subtle bg-elevated px-3 py-2 text-sm text-primary"
          value={value ?? ''}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={loading && trials.length === 0}
        >
          <option value="">Select a Trial</option>
          {trials.map((trial) => (
            <option key={trial.id} value={trial.id}>
              {trial.title}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}

function BenchmarksFilters({
  status,
  timeRange,
  onStatusChange,
  onTimeRangeChange,
}: {
  status: string;
  timeRange: string;
  onStatusChange: (value: string) => void;
  onTimeRangeChange: (value: string) => void;
}) {
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="benchmarks-status"
            className="text-sm font-medium text-primary"
          >
            Status
          </label>
          <select
            id="benchmarks-status"
            value={status}
            onChange={(event) => onStatusChange(event.currentTarget.value)}
            className="w-full rounded-md border border-subtle bg-elevated px-3 py-2 text-sm text-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="benchmarks-time-range"
            className="text-sm font-medium text-primary"
          >
            Time range
          </label>
          <select
            id="benchmarks-time-range"
            value={timeRange}
            onChange={(event) => onTimeRangeChange(event.currentTarget.value)}
            className="w-full rounded-md border border-subtle bg-elevated px-3 py-2 text-sm text-primary"
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}

export default function BenchmarksPage({
  initialTrialId = null,
}: BenchmarksPageProps) {
  const router = useRouter();
  const [trialSelection, setTrialSelection] = useState<string | null>(
    initialTrialId,
  );
  const [trials, setTrials] = useState<TrialListItem[]>([]);
  const [trialsLoading, setTrialsLoading] = useState(true);
  const [loadState, setLoadState] = useState<LoadState>(() =>
    initialTrialId ? { status: 'loading' } : { status: 'idle' },
  );
  const [status, setStatus] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void listTrials({ signal: controller.signal, cache: 'no-store' })
      .then((items) => setTrials(items))
      .catch(() => setTrials([]))
      .finally(() => setTrialsLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!trialSelection) {
      return;
    }
    const controller = new AbortController();
    void getBenchmarks(
      {
        trialId: trialSelection,
        status,
        timeRange,
        page,
        pageSize: 25,
      },
      {
        signal: controller.signal,
        cache: 'no-store',
        dedupeKey: `benchmarks-${trialSelection}-${status}-${timeRange}-${page}`,
      },
    )
      .then((data) => {
        if (!data) {
          setLoadState({
            status: 'error',
            code: 404,
            message: 'No benchmark data was returned for this Trial.',
          });
          return;
        }
        setLoadState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        const code = Number(
          (error as { status?: number } | null)?.status ?? NaN,
        );
        setLoadState({
          status: 'error',
          code: Number.isFinite(code) ? code : null,
          message:
            (error as { message?: string } | null)?.message ??
            'Benchmarks could not be loaded.',
        });
      });
    return () => controller.abort();
  }, [page, status, timeRange, trialSelection]);

  const payload = loadState.status === 'ready' ? loadState.data : null;

  const handleTrialChange = (next: string) => {
    setLoadState({ status: 'loading' });
    setPage(1);
    setSelection(new Set());
    setSelectionMessage(null);
    setTrialSelection(next || null);
  };

  const handleStatusChange = (next: string) => {
    setLoadState({ status: 'loading' });
    setPage(1);
    setStatus(next);
  };

  const handleTimeRangeChange = (next: string) => {
    setLoadState({ status: 'loading' });
    setPage(1);
    setTimeRange(next);
  };

  const handlePreviousPage = () => {
    setLoadState({ status: 'loading' });
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    setLoadState({ status: 'loading' });
    setPage((current) => current + 1);
  };

  const handleSelectCandidate = (
    candidate: BenchmarkCandidate,
    nextChecked: boolean,
  ) => {
    setSelectionMessage(null);
    setSelection((current) => {
      const next = new Set(current);
      if (nextChecked) {
        if (next.size >= 3) {
          setSelectionMessage('You can compare up to 3 candidates at a time.');
          return current;
        }
        next.add(candidate.id);
        return next;
      }
      next.delete(candidate.id);
      return next;
    });
  };

  const handleRowOpen = (candidate: BenchmarkCandidate) => {
    if (!candidate.report_id || !trialSelection) return;
    router.push(
      `/talent-partner/trials/${encodeURIComponent(trialSelection)}/candidates/${encodeURIComponent(candidate.id)}/winoe-report`,
    );
  };

  const compareIds = [...selection];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Benchmarks
          </h1>
          <p className="text-sm text-secondary">
            Compare candidates evaluated by the same Trial.
          </p>
        </header>

        <Card>
          <p className="max-w-3xl text-sm text-secondary">
            Same Trial. Same Winoe instance. Same rubric.
          </p>
        </Card>

        <TrialSelector
          trials={trials}
          value={trialSelection}
          onChange={handleTrialChange}
          loading={trialsLoading}
        />

        {trialSelection ? (
          <>
            <BenchmarksFilters
              status={status}
              timeRange={timeRange}
              onStatusChange={handleStatusChange}
              onTimeRangeChange={handleTimeRangeChange}
            />

            {loadState.status === 'loading' ? (
              <Card>
                <p className="text-sm text-secondary">Loading benchmarks…</p>
              </Card>
            ) : loadState.status === 'error' ? (
              <EmptyBenchmarksCard
                title={
                  loadState.code === 403
                    ? 'Trial access restricted'
                    : loadState.code === 404
                      ? 'Trial not found'
                      : 'Benchmarks unavailable'
                }
                message={
                  loadState.code === 403
                    ? 'You do not have access to this Trial’s benchmark cohort.'
                    : loadState.code === 404
                      ? 'No benchmark cohort could be loaded for the selected Trial.'
                      : loadState.message
                }
              />
            ) : payload ? (
              payload.candidates.length === 0 ? (
                <EmptyBenchmarksCard
                  title="No candidates are available for this Trial yet."
                  message="Invite candidates or wait for the Trial roster to populate before comparing benchmark data."
                />
              ) : (
                <div className="space-y-5 pb-28">
                  <BenchmarksSummaryCard data={payload} />

                  <div className="space-y-2">
                    {selectionMessage ? (
                      <div
                        role="alert"
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                      >
                        {selectionMessage}
                      </div>
                    ) : null}

                    <BenchmarksTable
                      trialId={trialSelection}
                      data={payload}
                      selectedIds={selection}
                      onToggleCandidate={handleSelectCandidate}
                      onRowOpen={handleRowOpen}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm text-secondary">
                    <span>
                      Page {payload.pagination.page} of{' '}
                      {payload.pagination.total_pages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={payload.pagination.page <= 1}
                        onClick={handlePreviousPage}
                        className="rounded-md border border-subtle px-3 py-2 text-sm font-medium text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={
                          payload.pagination.page >=
                          payload.pagination.total_pages
                        }
                        onClick={handleNextPage}
                        className="rounded-md border border-subtle px-3 py-2 text-sm font-medium text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {selection.size >= 1 ? (
                    <SelectedBar
                      count={selection.size}
                      onCancel={() => setSelection(new Set())}
                      disabled={selection.size < 2}
                      onCompare={() => {
                        if (selection.size < 2 || selection.size > 3) return;
                        router.push(
                          `/talent-partner/benchmarks/compare?candidates=${encodeURIComponent(compareIds.join(','))}`,
                        );
                      }}
                    />
                  ) : null}
                </div>
              )
            ) : null}
          </>
        ) : (
          <EmptyBenchmarksCard
            title="Select a Trial to view benchmarks"
            message="The top-level Benchmarks route stays neutral until you pick a Trial. Once selected, cohort stats and candidate comparison load immediately."
          />
        )}
      </div>
    </div>
  );
}
