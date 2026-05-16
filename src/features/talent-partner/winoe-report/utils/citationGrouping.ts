import type { WinoeCitationViewModel } from '../winoeReport.viewModel';

export const ARTIFACT_GROUP_ORDER = [
  'Day 1 — Design Doc',
  'Day 2/3 — Code',
  'Day 4 — Handoff + Demo',
  'Day 5 — Reflection',
];

export function groupCitationsByArtifactGroup(
  citations: WinoeCitationViewModel[],
): Array<[string, WinoeCitationViewModel[]]> {
  const grouped = citations.reduce<Map<string, WinoeCitationViewModel[]>>(
    (acc, citation) => {
      const items = acc.get(citation.groupLabel) ?? [];
      items.push(citation);
      acc.set(citation.groupLabel, items);
      return acc;
    },
    new Map(),
  );

  const orderedKnownGroups = ARTIFACT_GROUP_ORDER.filter((label) =>
    grouped.has(label),
  );
  const orderedUnknownGroups = Array.from(grouped.keys())
    .filter((label) => !ARTIFACT_GROUP_ORDER.includes(label))
    .sort((a, b) => a.localeCompare(b));

  return [...orderedKnownGroups, ...orderedUnknownGroups].map((label) => [
    label,
    grouped.get(label) ?? [],
  ]);
}
