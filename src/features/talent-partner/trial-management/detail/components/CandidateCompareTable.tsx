import type { Dispatch, SetStateAction } from 'react';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import type { SortState } from './candidateCompareSort';
import { CandidateCompareTableHeader } from './CandidateCompareTableHeader';
import { CandidateCompareTableRow } from './CandidateCompareTableRow';

type Props = {
  trialId: string;
  sortedRows: CandidateCompareRow[];
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
  generatingIds: Record<string, boolean>;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareTable({
  trialId,
  sortedRows,
  sort,
  setSort,
  generatingIds,
  onGenerate,
}: Props) {
  return (
    <div className="overflow-hidden rounded border border-gray-200">
      <table className="w-full text-sm">
        <CandidateCompareTableHeader sort={sort} setSort={setSort} />
        <tbody className="divide-y divide-gray-200">
          {sortedRows.map((row) => (
            <CandidateCompareTableRow
              key={row.candidateSessionId}
              trialId={trialId}
              row={row}
              generatingIds={generatingIds}
              onGenerate={onGenerate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
