'use client';

import { useMemo, useState } from 'react';
import type { CandidateCompareRow } from '@/features/recruiter/api/candidatesCompare';
import {
  compareByColumn,
  compareDefault,
  nextSort,
  type SortState,
} from './candidateCompareSort';
import { CandidateCompareSectionBody } from './CandidateCompareSectionBody';

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
          <h2 className="text-lg font-semibold text-gray-900">Compare candidates</h2>
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
        <CandidateCompareSectionBody
          showLoading={showLoading}
          compareError={compareError}
          candidateCount={candidateCount}
          sortedRows={sortedRows}
          simulationId={simulationId}
          sort={sort}
          setSort={setSort}
          generatingIds={generatingIds}
          onRetry={onRetry}
          onGenerate={onGenerate}
        />
      </div>
    </section>
  );
}

export const __testables = {
  compareDefault,
  compareByColumn,
  nextSort,
};
