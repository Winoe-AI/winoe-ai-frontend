export type RubricRow = {
  dimension: string;
  whatWinoeWillLookFor: string;
  weightLabel: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export function mapRubricJsonToRows(rubricJson: unknown): RubricRow[] {
  if (Array.isArray(rubricJson)) {
    return rubricJson.map((item, idx) => {
      const rec = asRecord(item) ?? {};
      const dimension =
        pickString(
          rec.dimension,
          rec.name,
          rec.title,
          rec.criterion,
          `Dimension ${idx + 1}`,
        ) || `Dimension ${idx + 1}`;
      const what = pickString(
        rec.whatWinoeWillLookFor,
        rec.description,
        rec.criteria,
        rec.prompt,
        rec.summary,
        rec.details,
      );
      const weightRaw = rec.weight ?? rec.points ?? rec.score;
      let weightLabel: string | null = null;
      if (typeof weightRaw === 'number' && Number.isFinite(weightRaw)) {
        weightLabel = String(weightRaw);
      } else if (typeof weightRaw === 'string' && weightRaw.trim()) {
        weightLabel = weightRaw.trim();
      }
      return {
        dimension,
        whatWinoeWillLookFor: what || '—',
        weightLabel,
      };
    });
  }
  const root = asRecord(rubricJson);
  if (!root) return [];
  const dims = root.dimensions ?? root.criteria ?? root.rows;
  if (Array.isArray(dims)) {
    return mapRubricJsonToRows(dims);
  }
  return [];
}
