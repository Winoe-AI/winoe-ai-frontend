'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  getBenchmarkCompare,
  type BenchmarkCompareCandidate,
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
import { ScoreRing } from '../winoe-report/components/ScoreRing';
import { RadarChart } from '../winoe-report/components/RadarChart';

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      candidates: BenchmarkCompareCandidate[];
    }
  | { status: 'error'; code: number | null; message: string };

type ValidationErrorState = {
  status: 'error';
  code: number;
  message: string;
} | null;

function formatScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function statusLabel(status: BenchmarkCompareCandidate['status']): string {
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

function statusTone(
  status: BenchmarkCompareCandidate['status'],
): StatusPillTone {
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

function CandidateAvatar({ name, email }: { name: string; email: string }) {
  const initials = (name || email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-wheat-200 bg-wheat-50 text-sm font-semibold text-wheat-900">
      {initials || 'TP'}
    </div>
  );
}

function mapRadarDimensions(
  dimensions: BenchmarkCompareCandidate['radar_dimensions'],
) {
  return dimensions.map((dimension) => ({
    id: dimension.name,
    name: dimension.name,
    score: dimension.score,
    justification: '',
    citations: [],
  }));
}

function BenchmarksCompareError({
  code,
  message,
}: {
  code: number | null;
  message: string;
}) {
  return (
    <Card>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-primary">
          {code === 400
            ? 'Compare request invalid'
            : code === 403
              ? 'Compare access restricted'
              : code === 404
                ? 'Candidates not found'
                : 'Compare unavailable'}
        </h2>
        <p className="text-sm text-secondary">
          {code === 400
            ? 'Provide 2 or 3 candidate IDs from the same Trial.'
            : code === 403
              ? 'One or more selected candidates are not accessible to your Talent Partner account.'
              : code === 404
                ? 'One or more selected candidate IDs were not found.'
                : message}
        </p>
      </div>
    </Card>
  );
}

function CompareCandidateCard({
  candidate,
}: {
  candidate: BenchmarkCompareCandidate;
}) {
  const radarDimensions = mapRadarDimensions(candidate.radar_dimensions);
  const hasRadar = radarDimensions.length > 0;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CandidateAvatar name={candidate.name} email={candidate.email} />
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-primary">
                {candidate.name}
              </h3>
              <p className="truncate text-sm text-secondary">
                {candidate.email}
              </p>
              <p className="mt-1 text-sm text-secondary">
                {candidate.trial_title}
              </p>
            </div>
          </div>
          <StatusPill
            label={statusLabel(candidate.status)}
            tone={statusTone(candidate.status)}
          />
        </div>

        <div className="rounded-2xl border border-subtle bg-secondary p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                Winoe Score
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                {formatScore(candidate.winoe_score)}
              </p>
            </div>
            {candidate.report_id ? (
              <InlineBadge label="Report ready" tone="success" />
            ) : (
              <InlineBadge label="Report unavailable" tone="warning" />
            )}
          </div>
          <div className="mt-4 flex justify-center">
            {candidate.winoe_score === null ? (
              <div className="flex min-h-[260px] items-center justify-center text-sm text-secondary">
                No score available yet.
              </div>
            ) : (
              <ScoreRing score={candidate.winoe_score} />
            )}
          </div>
        </div>

        {hasRadar ? (
          <RadarChart dimensions={radarDimensions} />
        ) : (
          <div className="rounded-2xl border border-dashed border-subtle bg-secondary px-4 py-6 text-sm text-secondary">
            Radar chart unavailable for this candidate.
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            Dimensional list
          </h4>
          {candidate.dimensions.length > 0 ? (
            <ul className="space-y-2">
              {candidate.dimensions.map((dimension) => (
                <li
                  key={dimension.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-subtle bg-secondary px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-primary">
                    {dimension.name}
                  </span>
                  <span className="shrink-0 font-medium text-primary">
                    {formatScore(dimension.score)}/10
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-subtle bg-secondary px-4 py-4 text-sm text-secondary">
              No report data yet.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {candidate.report_id ? (
            <Link
              href={`/talent-partner/trials/${encodeURIComponent(candidate.trial_id)}/candidates/${encodeURIComponent(candidate.id)}/winoe-report`}
              className="font-medium text-wheat-700 hover:underline"
            >
              View full report
            </Link>
          ) : (
            <span className="text-secondary">View full report unavailable</span>
          )}
          <Link
            href={`/talent-partner/trials/${encodeURIComponent(candidate.trial_id)}/candidates/${encodeURIComponent(candidate.id)}/submission`}
            className="font-medium text-wheat-700 hover:underline"
          >
            View raw submission
          </Link>
        </div>
      </div>
    </Card>
  );
}

function SummaryTable({
  candidates,
}: {
  candidates: BenchmarkCompareCandidate[];
}) {
  const dimensionNames = useMemo(() => {
    const names: string[] = [];
    for (const candidate of candidates) {
      for (const dimension of candidate.dimensions) {
        if (!names.includes(dimension.name)) names.push(dimension.name);
      }
    }
    return names;
  }, [candidates]);

  if (dimensionNames.length === 0) {
    return (
      <Card>
        <div className="rounded-2xl border border-dashed border-subtle bg-secondary px-4 py-6 text-sm text-secondary">
          Summary comparison is unavailable because report dimensions are
          missing.
        </div>
      </Card>
    );
  }

  const scoreByCandidateAndDimension = new Map<string, Map<string, number>>();
  for (const candidate of candidates) {
    const map = new Map<string, number>();
    for (const dimension of candidate.dimensions) {
      map.set(dimension.name, dimension.score);
    }
    scoreByCandidateAndDimension.set(candidate.id, map);
  }

  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-subtle hover:bg-transparent">
            <TableHead>Dimension</TableHead>
            {candidates.map((candidate) => (
              <TableHead key={candidate.id}>{candidate.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dimensionNames.map((name) => {
            const scores = candidates
              .map((candidate) =>
                scoreByCandidateAndDimension.get(candidate.id)?.get(name),
              )
              .filter((score): score is number => typeof score === 'number');
            const best = scores.length > 0 ? Math.max(...scores) : null;
            return (
              <TableRow key={name}>
                <TableCell className="font-medium text-primary">
                  {name}
                </TableCell>
                {candidates.map((candidate) => {
                  const score =
                    scoreByCandidateAndDimension.get(candidate.id)?.get(name) ??
                    null;
                  const highlighted = best !== null && score === best;
                  return (
                    <TableCell key={`${candidate.id}-${name}`}>
                      <span
                        className={[
                          'inline-flex min-w-16 items-center justify-center rounded-full px-3 py-1 text-sm font-medium',
                          highlighted
                            ? 'bg-wheat-50 text-wheat-900 ring-1 ring-wheat-200'
                            : 'bg-secondary text-primary',
                        ].join(' ')}
                      >
                        {score === null ? '—' : `${formatScore(score)}/10`}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function BenchmarksComparePage() {
  const searchParams = useSearchParams();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  const candidateIds = useMemo(() => {
    const raw =
      searchParams.get('candidates') ?? searchParams.get('candidate_ids') ?? '';
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }, [searchParams]);

  const validationError = useMemo<ValidationErrorState>(() => {
    if (candidateIds.length < 2 || candidateIds.length > 3) {
      return {
        status: 'error',
        code: 400,
        message: 'Compare requires 2 or 3 candidates.',
      };
    }
    return null;
  }, [candidateIds]);

  useEffect(() => {
    const controller = new AbortController();
    if (validationError) {
      return () => controller.abort();
    }

    void getBenchmarkCompare(candidateIds, {
      signal: controller.signal,
      cache: 'no-store',
      dedupeKey: `benchmarks-compare-${candidateIds.join('-')}`,
    })
      .then((data) => {
        if (!data) {
          setLoadState({
            status: 'error',
            code: 404,
            message: 'No comparison data was returned.',
          });
          return;
        }
        setLoadState({ status: 'ready', candidates: data.candidates });
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
            'Candidate comparison could not be loaded.',
        });
      });
    return () => controller.abort();
  }, [candidateIds, validationError]);

  const fairnessNote =
    'These candidates are comparable because they completed the same Trial under the same Calibration and were evaluated by the same Winoe instance.';

  const compareGridClassName =
    loadState.status === 'ready' && loadState.candidates.length === 3
      ? 'grid gap-4 xl:grid-cols-3'
      : 'grid gap-4 xl:grid-cols-2';

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Side-by-side comparison
          </h1>
          <p className="text-sm text-secondary">
            Same Trial. Same Winoe instance. Same rubric.
          </p>
        </header>

        <Card>
          <p className="max-w-3xl text-sm text-secondary">{fairnessNote}</p>
        </Card>

        {validationError ? (
          <BenchmarksCompareError
            code={validationError.code}
            message={validationError.message}
          />
        ) : loadState.status === 'loading' ? (
          <Card>
            <p className="text-sm text-secondary">Loading comparison…</p>
          </Card>
        ) : loadState.status === 'error' ? (
          <BenchmarksCompareError
            code={loadState.code}
            message={loadState.message}
          />
        ) : (
          <div className="space-y-6 pb-8">
            <div
              className={compareGridClassName}
              data-testid="benchmarks-compare-grid"
            >
              {loadState.candidates.map((candidate) => (
                <CompareCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                />
              ))}
            </div>

            <SummaryTable candidates={loadState.candidates} />

            {loadState.candidates.some((candidate) => !candidate.report_id) ? (
              <Card>
                <p className="text-sm text-secondary">
                  Report data is shown only where it exists. Missing dimensions
                  are left blank rather than inferred.
                </p>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
