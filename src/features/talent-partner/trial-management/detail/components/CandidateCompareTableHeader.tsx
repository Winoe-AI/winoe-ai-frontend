import type { Dispatch, SetStateAction } from 'react';
import {
  nextSort,
  sortAriaValue,
  sortIndicator,
  type SortColumn,
  type SortState,
} from './candidateCompareSort';

type Props = {
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
};

function SortHeaderCell({
  column,
  label,
  sort,
  setSort,
}: {
  column: SortColumn;
  label: string;
  sort: SortState | null;
  setSort: Dispatch<SetStateAction<SortState | null>>;
}) {
  return (
    <th
      scope="col"
      aria-sort={sortAriaValue(sort, column)}
      className="px-4 py-3"
    >
      <button
        type="button"
        onClick={() => setSort((current) => nextSort(current, column))}
        className="inline-flex items-center gap-1 font-medium hover:text-gray-900"
      >
        {label} <span aria-hidden="true">{sortIndicator(sort, column)}</span>
      </button>
    </th>
  );
}

export function CandidateCompareTableHeader({ sort, setSort }: Props) {
  return (
    <thead className="bg-gray-50 text-left text-gray-600">
      <tr>
        <SortHeaderCell
          column="candidate"
          label="Candidate"
          sort={sort}
          setSort={setSort}
        />
        <SortHeaderCell
          column="winoe_score"
          label="Winoe Score"
          sort={sort}
          setSort={setSort}
        />
        <th scope="col" className="px-4 py-3">
          Dimensional summary
        </th>
        <th scope="col" className="px-4 py-3">
          Evidence summary
        </th>
        <th scope="col" className="px-4 py-3">
          Winoe Report
        </th>
      </tr>
    </thead>
  );
}
