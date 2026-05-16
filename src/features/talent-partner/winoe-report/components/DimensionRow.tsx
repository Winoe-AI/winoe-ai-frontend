import Button from '@/shared/ui/Button';
import { cn } from '@/shared/ui/classnames';
import type { WinoeReportViewModel } from '../winoeReport.viewModel';
import { formatDimensionScore } from '../utils/reportFormatting';

type Props = {
  dimension: WinoeReportViewModel['dimensions'][number];
  selected: boolean;
  onOpenEvidence: () => void;
};

export function DimensionRow({ dimension, selected, onOpenEvidence }: Props) {
  return (
    <li
      className={cn(
        'dimension-row group rounded-3xl border p-4 transition',
        selected
          ? 'border-wheat-300 bg-wheat-50 shadow-sm'
          : 'border-subtle bg-elevated hover:border-wheat-100 hover:bg-secondary',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                {dimension.name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-secondary">
                {formatDimensionScore(dimension.score)}
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-secondary">
            {dimension.justification}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenEvidence}
          data-testid="view-evidence-button"
          data-dimension-id={dimension.id}
          className="mt-1 shrink-0 transition focus-visible:ring-2 focus-visible:ring-wheat-500 focus-visible:ring-offset-2"
        >
          View evidence
        </Button>
      </div>
    </li>
  );
}
