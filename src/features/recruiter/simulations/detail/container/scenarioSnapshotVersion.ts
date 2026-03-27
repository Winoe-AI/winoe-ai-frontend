import type { ScenarioContentAvailability } from '../utils/detail';
import type { ScenarioVersionSnapshot } from './types';

function mergeContentAvailability(
  current: ScenarioContentAvailability,
  incoming: ScenarioContentAvailability,
): ScenarioContentAvailability {
  const rank: Record<ScenarioContentAvailability, number> = {
    unavailable: 0,
    local_only: 1,
    canonical: 2,
  };
  return rank[current] >= rank[incoming] ? current : incoming;
}

export function mergeScenarioSnapshot(
  current: ScenarioVersionSnapshot | undefined,
  incoming: ScenarioVersionSnapshot,
): ScenarioVersionSnapshot {
  if (!current) return incoming;
  return {
    id: incoming.id,
    versionIndex: incoming.versionIndex ?? current.versionIndex,
    status: incoming.status ?? current.status,
    lockedAt: incoming.lockedAt ?? current.lockedAt,
    contentAvailability: mergeContentAvailability(
      current.contentAvailability,
      incoming.contentAvailability,
    ),
    storylineMd: incoming.storylineMd ?? current.storylineMd,
    taskPrompts: incoming.taskPrompts ?? current.taskPrompts,
    rubric: incoming.rubric ?? current.rubric,
  };
}

export function inferNextVersionIndex(
  snapshots: ScenarioVersionSnapshot[],
  fallback: number | null,
): number | null {
  const maxKnown = snapshots.reduce((max, snapshot) => {
    if (snapshot.versionIndex == null) return max;
    return Math.max(max, snapshot.versionIndex);
  }, 0);
  if (maxKnown > 0) return maxKnown + 1;
  if (fallback != null && fallback > 0) return fallback + 1;
  return null;
}
