'use client';

import type { RubricRow } from './rubricMapper';

type Props = {
  rows: RubricRow[];
};

export function EvaluationRubricTable({ rows }: Props) {
  if (!rows.length) {
    return (
      <p className="text-sm text-secondary">
        No rubric dimensions were returned for this Trial yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="min-w-full divide-y divide-subtle text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-primary">
              Dimension
            </th>
            <th className="px-4 py-3 text-left font-semibold text-primary">
              What Winoe will look for
            </th>
            <th className="px-4 py-3 text-left font-semibold text-primary">
              Weight
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle bg-elevated">
          {rows.map((row, i) => (
            <tr key={`${row.dimension}-${i}`}>
              <td className="px-4 py-3 font-medium text-primary">
                {row.dimension}
              </td>
              <td className="px-4 py-3 text-secondary">
                {row.whatWinoeWillLookFor}
              </td>
              <td className="px-4 py-3 text-secondary">
                {row.weightLabel ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
