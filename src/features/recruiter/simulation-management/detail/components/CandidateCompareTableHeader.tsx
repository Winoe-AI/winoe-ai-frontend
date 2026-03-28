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
          column="status"
          label="Status"
          sort={sort}
          setSort={setSort}
        />
        <SortHeaderCell
          column="fit_profile"
          label="Fit Profile"
          sort={sort}
          setSort={setSort}
        />
        <SortHeaderCell
          column="fit_score"
          label="Fit Score"
          sort={sort}
          setSort={setSort}
        />
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
  );
}
