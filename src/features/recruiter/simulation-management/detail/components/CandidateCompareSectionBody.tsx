import type { Dispatch, SetStateAction } from 'react';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { TableSkeleton } from '@/shared/ui/TableSkeleton';
import type { CandidateCompareRow } from '@/features/recruiter/api/candidatesCompareApi';
import type { SortState } from './candidateCompareSort';
import { CandidateCompareTable } from './CandidateCompareTable';

type Props = {
  showLoading: boolean;
  compareError: string | null;
  candidateCount: number;
  sortedRows: CandidateCompareRow[];
  simulationId: string;
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
  generatingIds: Record<string, boolean>;
  onRetry: () => void;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareSectionBody({
  showLoading,
  compareError,
  candidateCount,
  sortedRows,
  simulationId,
  sort,
  setSort,
  generatingIds,
  onRetry,
  onGenerate,
}: Props) {
  if (showLoading) {
    return <TableSkeleton columns={7} rows={3} className="bg-white" />;
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
  if (candidateCount === 0) {
    return (
      <EmptyState
        title="No comparison data yet"
        description="Invite candidates to this simulation to unlock side-by-side Fit Score comparisons."
      />
    );
  }
  if (sortedRows.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        Comparison data is not available yet.
      </div>
    );
  }
  return (
    <CandidateCompareTable
      simulationId={simulationId}
      sortedRows={sortedRows}
      sort={sort}
      setSort={setSort}
      generatingIds={generatingIds}
      onGenerate={onGenerate}
    />
  );
}
