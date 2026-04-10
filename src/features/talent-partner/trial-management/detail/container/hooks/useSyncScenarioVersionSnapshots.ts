import type { TrialDetailPreview } from '../../utils/detailUtils';
import { toScenarioSnapshotFromDetail } from '../scenarioSnapshotData';
import {
  inferNextVersionIndex,
  mergeScenarioSnapshot,
} from '../scenarioSnapshotVersion';
import type { ScenarioVersionSnapshot } from '../types';

type Params = {
  currentSnapshots: Record<string, ScenarioVersionSnapshot>;
  detail: TrialDetailPreview;
  fallbackTaskPrompts: Array<Record<string, unknown>> | null;
  pendingRegenerationScenarioVersionId: string | null;
};

export function syncScenarioVersionSnapshots({
  currentSnapshots,
  detail,
  fallbackTaskPrompts,
  pendingRegenerationScenarioVersionId,
}: Params): Record<string, ScenarioVersionSnapshot> {
  const activeSnapshot = toScenarioSnapshotFromDetail({
    detail,
    fallbackTaskPrompts,
  });
  const next: Record<string, ScenarioVersionSnapshot> = { ...currentSnapshots };

  for (const version of detail.scenarioVersions) {
    if (!version.id) continue;
    const current = next[version.id];
    next[version.id] = mergeScenarioSnapshot(current, {
      id: version.id,
      versionIndex: version.versionIndex,
      status: version.status,
      lockedAt: version.lockedAt,
      contentAvailability: version.contentAvailability,
      storylineMd: current?.storylineMd ?? null,
      taskPrompts: current?.taskPrompts ?? null,
      rubric: current?.rubric ?? null,
    });
  }

  if (activeSnapshot) {
    next[activeSnapshot.id] = mergeScenarioSnapshot(
      next[activeSnapshot.id],
      activeSnapshot,
    );
  }

  const pendingId = detail.pendingScenarioVersionId;
  if (!pendingId) return next;

  const inferredIndex =
    next[pendingId]?.versionIndex ??
    (activeSnapshot?.versionIndex != null
      ? activeSnapshot.versionIndex + 1
      : null) ??
    inferNextVersionIndex(
      Object.values(next),
      activeSnapshot?.versionIndex ?? null,
    );

  const inferredStatus =
    pendingRegenerationScenarioVersionId === pendingId
      ? 'generating'
      : (detail.generationJob?.status ?? next[pendingId]?.status ?? 'ready');

  next[pendingId] = mergeScenarioSnapshot(next[pendingId], {
    id: pendingId,
    versionIndex: inferredIndex,
    status: inferredStatus,
    lockedAt: null,
    contentAvailability:
      pendingRegenerationScenarioVersionId === pendingId
        ? 'local_only'
        : 'unavailable',
    storylineMd: next[pendingId]?.storylineMd ?? null,
    taskPrompts: next[pendingId]?.taskPrompts ?? null,
    rubric: next[pendingId]?.rubric ?? null,
  });

  return next;
}
