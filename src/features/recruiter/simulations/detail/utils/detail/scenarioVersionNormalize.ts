import { toStringOrNull } from '../parsing';
import {
  asRecord,
  hasCanonicalScenarioContent,
  parseContentAvailability,
  parseVersionIndex,
  toNonEmptyString,
} from './parsers';
import type { ScenarioContentAvailability, SimulationScenarioVersion } from './types';

export function mergeContentAvailability(
  left: ScenarioContentAvailability,
  right: ScenarioContentAvailability,
): ScenarioContentAvailability {
  const rank: Record<ScenarioContentAvailability, number> = {
    unavailable: 0,
    local_only: 1,
    canonical: 2,
  };
  return rank[left] >= rank[right] ? left : right;
}

export function normalizeScenarioVersionRecord(
  record: Record<string, unknown> | null,
  fallback?: { id?: string | null; versionIndex?: number | null },
): SimulationScenarioVersion {
  const id =
    toNonEmptyString(
      record?.id ??
        record?.scenarioVersionId ??
        record?.scenario_version_id ??
        fallback?.id,
    ) ?? null;
  const versionIndex =
    parseVersionIndex(
      record?.versionIndex ??
        record?.version_index ??
        record?.version ??
        fallback?.versionIndex,
    ) ?? null;
  const status = toStringOrNull(record?.status)?.toLowerCase() ?? null;
  const lockedAt = toStringOrNull(record?.lockedAt ?? record?.locked_at) ?? null;
  const contentAvailability =
    parseContentAvailability(
      record?.contentAvailability ?? record?.content_availability,
    ) ?? (hasCanonicalScenarioContent(record) ? 'canonical' : 'unavailable');
  return {
    id,
    versionIndex,
    status,
    lockedAt,
    isLocked: Boolean(lockedAt) || status === 'locked',
    contentAvailability,
  };
}

export function normalizeScenarioVersion(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
  activeScenarioVersionId: string | null,
): SimulationScenarioVersion {
  const summary = asRecord(
    raw.scenarioVersionSummary ?? raw.scenario_version_summary ?? raw.scenarioVersion,
  );
  const idFallback =
    toNonEmptyString(
      summary?.id ??
        summary?.scenarioId ??
        summary?.scenario_id ??
        raw.scenarioId ??
        raw.scenario_id,
    ) ?? activeScenarioVersionId;
  const versionIndexFallback =
    parseVersionIndex(
      summary?.versionIndex ??
        summary?.version_index ??
        summary?.version ??
        raw.versionIndex ??
        raw.version_index ??
        raw.version,
    ) ?? null;
  const source = { ...(summary ?? {}), ...(scenario ?? {}) };
  const normalized = normalizeScenarioVersionRecord(source, {
    id: idFallback,
    versionIndex: versionIndexFallback,
  });
  return scenario
    ? { ...normalized, contentAvailability: 'canonical' }
    : normalized;
}
