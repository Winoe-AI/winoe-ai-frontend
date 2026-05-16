import type { WinoeReportViewModel } from '../winoeReport.viewModel';
import { DimensionRow } from './DimensionRow';
import { RadarChart } from './RadarChart';

type Props = {
  dimensions: WinoeReportViewModel['dimensions'];
  cohortMedian?: Record<string, number>;
  selectedDimensionId: string | null;
  onOpenEvidence: (dimensionId: string) => void;
};

export function DimensionalBreakdown({
  dimensions,
  cohortMedian,
  selectedDimensionId,
  onOpenEvidence,
}: Props) {
  return (
    <section className="dimensional-breakdown space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          Dimensional Breakdown
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Eight dimensions, one artifact-backed view of the Trial.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <RadarChart dimensions={dimensions} cohortMedian={cohortMedian} />
        <ol className="space-y-3">
          {dimensions.map((dimension) => (
            <DimensionRow
              key={dimension.id}
              dimension={dimension}
              selected={selectedDimensionId === dimension.id}
              onOpenEvidence={() => onOpenEvidence(dimension.id)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
