import type { Dispatch, SetStateAction } from 'react';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { TableSkeleton } from '@/shared/ui/TableSkeleton';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import type { SortState } from './candidateCompareSort';
import { CandidateCompareTable } from './CandidateCompareTable';

type Props = {
  showLoading: boolean;
  compareError: string | null;
  cohortCount: number;
  sortedRows: CandidateCompareRow[];
  trialId: string;
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
  onRetry: () => void;
};

export function CandidateCompareSectionBody({
  showLoading,
  compareError,
  cohortCount,
  sortedRows,
  trialId,
  sort,
  setSort,
  onRetry,
}: Props) {
  if (showLoading) {
    return <TableSkeleton columns={5} rows={3} className="bg-white" />;
  }
  if (compareError) {
    return (
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
    );
  }
  if (cohortCount === 0) {
    return (
      <EmptyState
        title="No completed candidates yet"
        description="Benchmarks will appear once candidates complete this Trial and Winoe Reports are available."
      />
    );
  }
  return (
    <CandidateCompareTable
      trialId={trialId}
      sortedRows={sortedRows}
      sort={sort}
      setSort={setSort}
    />
  );
}
