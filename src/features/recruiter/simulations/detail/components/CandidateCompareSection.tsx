'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { statusMeta } from '@/shared/status/statusMeta';
import { StatusPill } from '@/shared/ui/StatusPill';
import { TableSkeleton } from '@/shared/ui/TableSkeleton';
import {
  formatRecommendationLabel,
  formatScorePercent,
} from '@/features/recruiter/simulations/candidates/fitProfile/fitProfileFormatting';
import type {
  CandidateCompareFitProfileStatus,
  CandidateCompareRow,
} from '@/features/recruiter/api/candidatesCompare';

type SortColumn = 'candidate' | 'status' | 'fit_profile' | 'fit_score';
type SortDirection = 'asc' | 'desc';
type SortState = {
  column: SortColumn;
  direction: SortDirection;
};

const FIT_PROFILE_ORDER: Record<CandidateCompareFitProfileStatus, number> = {
  ready: 0,
  generating: 1,
  failed: 2,
  not_generated: 3,
};

const FIT_PROFILE_META: Record<
  CandidateCompareFitProfileStatus,
  { label: string; tone: 'info' | 'success' | 'warning' | 'muted' }
> = {
  not_generated: { label: 'Not generated', tone: 'muted' },
  generating: { label: 'Generating', tone: 'info' },
  ready: { label: 'Ready', tone: 'success' },
  failed: { label: 'Failed', tone: 'warning' },
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

function compareDefault(
  a: CandidateCompareRow,
  b: CandidateCompareRow,
): number {
  const fitProfileDelta =
    FIT_PROFILE_ORDER[a.fitProfileStatus] -
    FIT_PROFILE_ORDER[b.fitProfileStatus];
  if (fitProfileDelta !== 0) return fitProfileDelta;

  const scoreA = a.overallFitScore ?? -1;
  const scoreB = b.overallFitScore ?? -1;
  if (scoreA !== scoreB) return scoreB - scoreA;

  const updatedDelta = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
  if (updatedDelta !== 0) return updatedDelta;

  return a.candidateLabel.localeCompare(b.candidateLabel);
}

function compareByColumn(
  a: CandidateCompareRow,
  b: CandidateCompareRow,
  sort: SortState,
): number {
  let base = 0;

  if (sort.column === 'candidate') {
    base = a.candidateLabel.localeCompare(b.candidateLabel);
  } else if (sort.column === 'status') {
    base = (a.status ?? '').localeCompare(b.status ?? '');
  } else if (sort.column === 'fit_profile') {
    base =
      FIT_PROFILE_ORDER[a.fitProfileStatus] -
      FIT_PROFILE_ORDER[b.fitProfileStatus];
  } else if (sort.column === 'fit_score') {
    const scoreA = a.overallFitScore ?? -1;
    const scoreB = b.overallFitScore ?? -1;
    base = scoreA - scoreB;
  }

  if (base === 0) return compareDefault(a, b);
  return sort.direction === 'asc' ? base : -base;
}

function nextSort(current: SortState | null, column: SortColumn): SortState {
  if (!current || current.column !== column) {
    return {
      column,
      direction: column === 'fit_score' ? 'desc' : 'asc',
    };
  }

  return {
    column,
    direction: current.direction === 'asc' ? 'desc' : 'asc',
  };
}

function sortIndicator(sort: SortState | null, column: SortColumn): string {
  if (!sort || sort.column !== column) return '↕';
  return sort.direction === 'asc' ? '↑' : '↓';
}

function sortAriaValue(
  sort: SortState | null,
  column: SortColumn,
): 'none' | 'ascending' | 'descending' {
  if (!sort || sort.column !== column) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

function formatCandidateLabel(row: CandidateCompareRow): string {
  return row.candidateName ?? row.candidateEmail ?? row.candidateLabel;
}

function formatStrengthRisk(row: CandidateCompareRow) {
  const strengths = row.strengths.slice(0, 2);
  const risks = row.risks.slice(0, 2);

  if (!strengths.length && !risks.length) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {strengths.map((strength) => (
        <span
          key={`strength-${row.candidateSessionId}-${strength}`}
          className="max-w-[180px] truncate rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800"
          title={strength}
        >
          Strength: {strength}
        </span>
      ))}
      {risks.map((risk) => (
        <span
          key={`risk-${row.candidateSessionId}-${risk}`}
          className="max-w-[180px] truncate rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
          title={risk}
        >
          Risk: {risk}
        </span>
      ))}
    </div>
  );
}

type Props = {
  simulationId: string;
  candidateCount: number;
  candidatesLoading: boolean;
  compareLoading: boolean;
  compareError: string | null;
  rows: CandidateCompareRow[];
  generatingIds: Record<string, boolean>;
  onRetry: () => void;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareSection({
  simulationId,
  candidateCount,
  candidatesLoading,
  compareLoading,
  compareError,
  rows,
  generatingIds,
  onRetry,
  onGenerate,
}: Props) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return [...rows].sort(compareDefault);
    return [...rows].sort((a, b) => compareByColumn(a, b, sort));
  }, [rows, sort]);

  const readyCount = useMemo(
    () => rows.filter((row) => row.fitProfileStatus === 'ready').length,
    [rows],
  );

  const showLoading =
    candidatesLoading || (candidateCount > 0 && compareLoading);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Compare candidates
          </h2>
          <p className="text-sm text-gray-600">
            Decision-ready Fit Score summary with quick links to Fit Profile and
            Evidence Trail submissions.
          </p>
        </div>
        {rows.length > 0 ? (
          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
            Fit Profile ready: {readyCount} / {rows.length}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {showLoading ? (
          <TableSkeleton columns={7} rows={3} className="bg-white" />
        ) : compareError ? (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <div>{compareError}</div>
            <div className="mt-2">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </div>
          </div>
        ) : candidateCount === 0 ? (
          <EmptyState
            title="No comparison data yet"
            description="Invite candidates to this simulation to unlock side-by-side Fit Score comparisons."
          />
        ) : sortedRows.length === 0 ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Comparison data is not available yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th
                    scope="col"
                    aria-sort={sortAriaValue(sort, 'candidate')}
                    className="px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort((current) => nextSort(current, 'candidate'))
                      }
                      className="inline-flex items-center gap-1 font-medium hover:text-gray-900"
                    >
                      Candidate{' '}
                      <span aria-hidden="true">
                        {sortIndicator(sort, 'candidate')}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={sortAriaValue(sort, 'status')}
                    className="px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort((current) => nextSort(current, 'status'))
                      }
                      className="inline-flex items-center gap-1 font-medium hover:text-gray-900"
                    >
                      Status{' '}
                      <span aria-hidden="true">
                        {sortIndicator(sort, 'status')}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={sortAriaValue(sort, 'fit_profile')}
                    className="px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort((current) => nextSort(current, 'fit_profile'))
                      }
                      className="inline-flex items-center gap-1 font-medium hover:text-gray-900"
                    >
                      Fit Profile{' '}
                      <span aria-hidden="true">
                        {sortIndicator(sort, 'fit_profile')}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={sortAriaValue(sort, 'fit_score')}
                    className="px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort((current) => nextSort(current, 'fit_score'))
                      }
                      className="inline-flex items-center gap-1 font-medium hover:text-gray-900"
                    >
                      Fit Score{' '}
                      <span aria-hidden="true">
                        {sortIndicator(sort, 'fit_score')}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Recommendation
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Strengths / Risks
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedRows.map((row) => {
                  const status = statusMeta(row.status, 'Unknown');
                  const fitProfile = FIT_PROFILE_META[row.fitProfileStatus];
                  const isGenerating =
                    generatingIds[row.candidateSessionId] ||
                    row.fitProfileStatus === 'generating';
                  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${row.candidateSessionId}`;
                  const fitProfileHref = `${submissionsHref}/fit-profile`;

                  return (
                    <tr
                      key={row.candidateSessionId}
                      data-testid={`candidate-compare-row-${row.candidateSessionId}`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">
                          {formatCandidateLabel(row)}
                        </div>
                        {row.candidateEmail ? (
                          <div className="text-xs text-gray-500">
                            {row.candidateEmail}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusPill label={status.label} tone={status.tone} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusPill
                          label={fitProfile.label}
                          tone={fitProfile.tone}
                        />
                      </td>
                      <td className="px-4 py-3 align-top font-semibold text-gray-900">
                        {row.overallFitScore === null
                          ? '—'
                          : formatScorePercent(row.overallFitScore)}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">
                        {row.recommendation
                          ? formatRecommendationLabel(row.recommendation)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {formatStrengthRisk(row)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <Link
                            className="text-blue-600 hover:underline"
                            href={submissionsHref}
                            prefetch={LINK_PREFETCH}
                          >
                            View Submissions
                          </Link>
                          <Link
                            className="text-blue-600 hover:underline"
                            href={fitProfileHref}
                            prefetch={LINK_PREFETCH}
                          >
                            View Fit Profile
                          </Link>
                          {row.fitProfileStatus !== 'ready' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onGenerate(row.candidateSessionId)}
                              disabled={isGenerating}
                            >
                              {isGenerating
                                ? 'Generating Fit Profile'
                                : 'Generate Fit Profile'}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export const __testables = {
  compareDefault,
  compareByColumn,
  nextSort,
};
