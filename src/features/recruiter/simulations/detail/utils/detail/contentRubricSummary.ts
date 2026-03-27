import { toStringOrNull } from '../parsing';

export function readRubricSummary(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): string | null {
  return (
    toStringOrNull(
      raw.rubricSummary ??
        raw.rubric_summary ??
        raw.rubricOverview ??
        raw.rubric_overview,
    ) ??
    (scenario
      ? toStringOrNull(
          scenario.rubricSummary ??
            scenario.rubric_summary ??
            scenario.rubricOverview ??
            scenario.rubric_overview,
        )
      : null)
  );
}
