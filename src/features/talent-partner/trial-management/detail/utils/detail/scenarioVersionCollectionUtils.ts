import { asRecord } from './parsersUtils';
import {
  mergeContentAvailability,
  normalizeScenarioVersionRecord,
} from './scenarioVersionNormalizeUtils';
import type { TrialScenarioVersion } from './typesUtils';

export function mergeScenarioVersions(
  versions: TrialScenarioVersion[],
): TrialScenarioVersion[] {
  const byId = new Map<string, TrialScenarioVersion>();
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
): TrialScenarioVersion[] {
  const source = raw.scenarioVersions ?? raw.scenario_versions;
  if (!Array.isArray(source)) return [];
  return source
    .map((entry) => normalizeScenarioVersionRecord(asRecord(entry)))
    .filter((entry) => Boolean(entry.id));
}
