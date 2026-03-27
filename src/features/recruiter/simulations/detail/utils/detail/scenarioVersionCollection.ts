import { asRecord } from './parsers';
import { mergeContentAvailability, normalizeScenarioVersionRecord } from './scenarioVersionNormalize';
import type { SimulationScenarioVersion } from './types';

export function mergeScenarioVersions(
  versions: SimulationScenarioVersion[],
): SimulationScenarioVersion[] {
  const byId = new Map<string, SimulationScenarioVersion>();
  for (const version of versions) {
    if (!version.id) continue;
    const existing = byId.get(version.id);
    if (!existing) {
      byId.set(version.id, version);
      continue;
    }
    byId.set(version.id, {
      id: version.id,
      versionIndex: version.versionIndex ?? existing.versionIndex,
      status: version.status ?? existing.status,
      lockedAt: version.lockedAt ?? existing.lockedAt,
      isLocked: existing.isLocked || version.isLocked,
      contentAvailability: mergeContentAvailability(
        existing.contentAvailability,
        version.contentAvailability,
      ),
    });
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aIndex = a.versionIndex ?? Number.MAX_SAFE_INTEGER;
    const bIndex = b.versionIndex ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
}

export function readScenarioVersionList(
  raw: Record<string, unknown>,
): SimulationScenarioVersion[] {
  const source = raw.scenarioVersions ?? raw.scenario_versions;
  if (!Array.isArray(source)) return [];
  return source
    .map((entry) => normalizeScenarioVersionRecord(asRecord(entry)))
    .filter((entry) => Boolean(entry.id));
}
