import { useMemo, useState } from 'react';
import type { ScenarioVersionItem } from '../../scenario';

type UseSelectedScenarioVersionArgs = {
  scenarioVersions: ScenarioVersionItem[];
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
};

export function useSelectedScenarioVersion({
  scenarioVersions,
  activeScenarioVersionId,
  pendingScenarioVersionId,
}: UseSelectedScenarioVersionArgs) {
  const [selectedScenarioVersionId, setSelectedScenarioVersionId] = useState<
    string | null
  >(null);
  const resolvedScenarioVersionId = useMemo(() => {
    const selectedExists =
      selectedScenarioVersionId != null &&
      scenarioVersions.some(
        (version) => version.id === selectedScenarioVersionId,
      );
    if (selectedExists) return selectedScenarioVersionId;
    return (
      pendingScenarioVersionId ??
      activeScenarioVersionId ??
      scenarioVersions[scenarioVersions.length - 1]?.id ??
      null
    );
  }, [
    activeScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersions,
    selectedScenarioVersionId,
  ]);

  const selectedScenarioVersion = useMemo(
    () =>
      scenarioVersions.find(
        (version) => version.id === resolvedScenarioVersionId,
      ) ?? null,
    [resolvedScenarioVersionId, scenarioVersions],
  );

  const previousScenarioVersion = useMemo(() => {
    if (!selectedScenarioVersion) return null;
    const index = scenarioVersions.findIndex(
      (version) => version.id === selectedScenarioVersion.id,
    );
    if (index <= 0) return null;
    return scenarioVersions[index - 1] ?? null;
  }, [scenarioVersions, selectedScenarioVersion]);

  return {
    previousScenarioVersion,
    selectedScenarioVersion,
    selectedScenarioVersionId: resolvedScenarioVersionId,
    setSelectedScenarioVersionId,
  };
}
