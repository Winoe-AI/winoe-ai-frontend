import type { Dispatch, SetStateAction } from 'react';
import type { CandidateCompareRow } from '@/features/recruiter/api/candidatesCompareApi';
import type { SortState } from './candidateCompareSort';
import { CandidateCompareTableHeader } from './CandidateCompareTableHeader';
import { CandidateCompareTableRow } from './CandidateCompareTableRow';

type Props = {
  simulationId: string;
  sortedRows: CandidateCompareRow[];
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
  generatingIds: Record<string, boolean>;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareTable({
  simulationId,
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
              simulationId={simulationId}
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
