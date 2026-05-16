import type { WinoeReportViewModel } from '../winoeReport.viewModel';

type Props = {
  dimensions: WinoeReportViewModel['dimensions'];
  cohortMedian?: Record<string, number>;
};

export function RadarChart({ dimensions, cohortMedian }: Props) {
  const size = 360;
  const center = size / 2;
  const outer = 132;
  const points = dimensions.slice(0, 8);
  const rings = [25, 50, 75, 100];
  const angleOffset = -Math.PI / 2;

  if (points.length === 0) {
    return (
      <figure className="overflow-hidden rounded-3xl border border-subtle bg-elevated p-5 shadow-sm">
        <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-subtle bg-secondary text-sm text-secondary">
          Radar chart unavailable until dimensions are returned.
        </div>
      </figure>
    );
  }

  const buildPoint = (score: number, index: number) => {
    const angle = angleOffset + (Math.PI * 2 * index) / points.length;
    const radius = outer * (score / 10);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return `${x},${y}`;
  };

  const axisPoint = (index: number, radius: number) => {
    const angle = angleOffset + (Math.PI * 2 * index) / points.length;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  };

  const candidatePolygon = points.map((dimension, index) =>
    buildPoint(dimension.score, index),
  );

  const medianPolygon =
    cohortMedian &&
    points.some((dimension) => cohortMedian[dimension.id] !== undefined)
      ? points.map((dimension, index) =>
          buildPoint(cohortMedian[dimension.id] ?? 0, index),
        )
      : null;

  return (
    <figure className="radar-chart relative overflow-hidden rounded-3xl border border-subtle bg-elevated p-5 shadow-sm">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="winoe-radar-title winoe-radar-desc"
      >
        <title id="winoe-radar-title">
          Winoe Report dimensional radar chart
        </title>
        <desc id="winoe-radar-desc">
          Radar chart showing eight dimensional scores, with the candidate
          polygon in wheat and an optional Benchmarks overlay.
        </desc>

        {rings.map((ring) => (
          <circle
            key={ring}
            cx={center}
            cy={center}
            r={(outer * ring) / 100}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
        ))}

        {points.map((dimension, index) => {
          const point = axisPoint(index, outer);
          const labelPoint = axisPoint(index, outer + 24);
          const angle = angleOffset + (Math.PI * 2 * index) / points.length;
          const isLeft = Math.cos(angle) < -0.2;
          const isRight = Math.cos(angle) > 0.2;
          const textAnchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

          return (
            <g key={dimension.id}>
              <line
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                fontFamily="var(--font-sans)"
              >
                {dimension.name}
              </text>
            </g>
          );
        })}

        {medianPolygon ? (
          <polygon
            points={medianPolygon.join(' ')}
            fill="none"
            stroke="var(--text-tertiary)"
            strokeDasharray="5 4"
            strokeWidth="1.5"
          />
        ) : null}

        <polygon
          points={candidatePolygon.join(' ')}
          fill="rgba(201, 166, 107, 0.24)"
          stroke="var(--wheat-700)"
          strokeWidth="2.5"
        />
      </svg>

      <figcaption className="mt-3 flex flex-wrap gap-3 text-xs text-secondary">
        <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-secondary px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-wheat-500" />
          Candidate
        </span>
        {medianPolygon ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-secondary px-3 py-1">
            <span className="h-2 w-2 rounded-full border border-dashed border-[color:var(--text-tertiary)]" />
            Benchmarks
          </span>
        ) : (
          <span className="rounded-full border border-subtle bg-secondary px-3 py-1">
            Benchmarks unavailable for this report
          </span>
        )}
      </figcaption>
    </figure>
  );
}
