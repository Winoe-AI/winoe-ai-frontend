'use client';

import { useMemo, useState } from 'react';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import {
  compareByColumn,
  compareDefault,
  nextSort,
  type SortState,
} from './candidateCompareSort';
import { CandidateCompareSectionBody } from './CandidateCompareSectionBody';

type Props = {
  trialId: string;
  candidateCount: number;
  candidatesLoading: boolean;
  compareLoading: boolean;
  compareError: string | null;
  rows: CandidateCompareRow[];
  onRetry: () => void;
};

export function CandidateCompareSection({
  trialId,
  candidateCount,
  candidatesLoading,
  compareLoading,
  compareError,
  rows,
  onRetry,
}: Props) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return [...rows].sort(compareDefault);
    return [...rows].sort((a, b) => compareByColumn(a, b, sort));
  }, [rows, sort]);

  const cohortCount = sortedRows.length;
  const showLoading =
    candidatesLoading || (candidateCount > 0 && compareLoading);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Benchmarks</h2>
          <p className="max-w-3xl text-sm text-gray-600">
            Compare completed candidates from this Trial using the same Winoe
            evaluation lens.
          </p>
          {cohortCount > 0 ? (
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>
                Comparing {cohortCount} candidate
                {cohortCount === 1 ? '' : 's'} for this Trial
              </p>
              {cohortCount < 3 ? (
                <p className="text-amber-700">
                  Limited comparison &mdash; results are more meaningful with
                  additional candidates.
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="mt-2 text-sm text-gray-600">
            Winoe surfaces evidence from each Trial. The Talent Partner makes
            the hiring decision.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CandidateCompareSectionBody
          showLoading={showLoading}
          compareError={compareError}
          cohortCount={cohortCount}
          sortedRows={sortedRows}
          trialId={trialId}
          sort={sort}
          setSort={setSort}
          onRetry={onRetry}
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
