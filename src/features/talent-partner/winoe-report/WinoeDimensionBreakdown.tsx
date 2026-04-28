import { useMemo, useState } from 'react';
import { Card } from '@/shared/ui/Card';
import type { WinoeReportDimension } from './winoeReport.types';
import { EvidenceList } from './EvidenceList';
import { formatCountLabel, formatScoreOutOf100 } from './winoeReportFormatting';

type Props = {
  dimensions: WinoeReportDimension[];
};

function dimensionScoreLabel(score: number | null): string {
  return score === null ? 'Score pending' : formatScoreOutOf100(score);
}

export function WinoeDimensionBreakdown({ dimensions }: Props) {
  const initialKey = dimensions[0]?.key ?? null;
  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey);

  const selectedDimension = useMemo(() => {
    if (!selectedKey) return dimensions[0] ?? null;
    return (
      dimensions.find((item) => item.key === selectedKey) ??
      dimensions[0] ??
      null
    );
  }, [dimensions, selectedKey]);

  if (dimensions.length === 0) {
    return (
      <Card className="winoe-report-avoid-break border-slate-200 bg-white">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Dimensional sub-scores
          </h2>
          <p className="text-sm text-slate-600">
            No dimensional sub-scores were returned yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Dimensional sub-scores
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a dimension to inspect the linked Evidence Trail artifacts.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {dimensions.map((dimension) => {
          const selected = selectedDimension?.key === dimension.key;
          return (
            <button
              key={dimension.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedKey(dimension.key)}
              className={[
                'text-left rounded-2xl border p-4 transition',
                selected
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {dimension.label}
                  </p>
                  {dimension.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {dimension.description}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
                  {dimensionScoreLabel(dimension.score)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  {formatCountLabel(dimension.evidenceCount, 'linked artifact')}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  {formatCountLabel(
                    dimension.linkedArtifactCount,
                    'artifact source',
                  )}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {dimension.summary ??
                  dimension.emptyStateMessage ??
                  'No linked artifacts were returned for this dimension yet.'}
              </p>
            </button>
          );
        })}
      </div>

      {selectedDimension ? (
        <Card className="winoe-report-avoid-break border-slate-200 bg-slate-50 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Evidence Trail drill-down
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                {selectedDimension.label}
              </h3>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
              {dimensionScoreLabel(selectedDimension.score)}
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {selectedDimension.summary ??
              selectedDimension.emptyStateMessage ??
              'No linked artifacts were returned for this dimension yet.'}
          </p>

          <div className="mt-4">
            <EvidenceList
              evidence={selectedDimension.evidence}
              emptyMessage={selectedDimension.emptyStateMessage ?? undefined}
            />
          </div>
        </Card>
      ) : null}
    </section>
  );
}
