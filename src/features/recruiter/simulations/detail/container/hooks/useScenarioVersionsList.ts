import { useMemo } from 'react';
import type { ScenarioVersionItem } from '../../scenario';
import { deriveScenarioUiStatus } from '../scenarioStatus';
import type { ScenarioVersionSnapshot } from '../types';

type UseScenarioVersionsListArgs = {
  scenarioVersionSnapshots: Record<string, ScenarioVersionSnapshot>;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  pendingRegenerationScenarioVersionId: string | null;
  isGenerating: boolean;
  simulationStatus: string | null;
};

export function useScenarioVersionsList({
  scenarioVersionSnapshots,
  activeScenarioVersionId,
  pendingScenarioVersionId,
  pendingRegenerationScenarioVersionId,
  isGenerating,
  simulationStatus,
}: UseScenarioVersionsListArgs): ScenarioVersionItem[] {
  return useMemo(() => {
    const snapshots = Object.values(scenarioVersionSnapshots);
    if (!snapshots.length) return [];
    return snapshots
      .map((snapshot) => {
        const isActive = activeScenarioVersionId != null && snapshot.id === activeScenarioVersionId;
        const isPending = pendingScenarioVersionId != null && snapshot.id === pendingScenarioVersionId;
        const uiStatus = deriveScenarioUiStatus({
          snapshot,
          simulationStatus,
          activeScenarioVersionId,
          pendingScenarioVersionId,
          regeneratingScenarioVersionId: pendingRegenerationScenarioVersionId,
          globalGenerating: isGenerating,
        });
        return {
          ...snapshot,
          uiStatus,
          isLocked: Boolean(snapshot.lockedAt) || snapshot.status === 'locked',
          isActive,
          isPending,
          taskPrompts: snapshot.taskPrompts,
          rubric: snapshot.rubric,
        };
      })
      .sort((a, b) => {
        const aIndex = a.versionIndex ?? Number.MAX_SAFE_INTEGER;
        const bIndex = b.versionIndex ?? Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.id.localeCompare(b.id);
      });
  }, [
    activeScenarioVersionId,
    isGenerating,
    pendingRegenerationScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersionSnapshots,
    simulationStatus,
  ]);
}
