import { useEffect, useMemo, useState } from 'react';
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
  const [selectedScenarioVersionId, setSelectedScenarioVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioVersions.length) {
      setSelectedScenarioVersionId(null);
      return;
    }
    const selectedExists =
      selectedScenarioVersionId != null &&
      scenarioVersions.some((version) => version.id === selectedScenarioVersionId);
    if (selectedExists) return;
    const preferredId =
      pendingScenarioVersionId ??
      activeScenarioVersionId ??
      scenarioVersions[scenarioVersions.length - 1]?.id ??
      null;
    setSelectedScenarioVersionId(preferredId);
  }, [
    activeScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersions,
    selectedScenarioVersionId,
  ]);

  const selectedScenarioVersion = useMemo(
    () => scenarioVersions.find((version) => version.id === selectedScenarioVersionId) ?? null,
    [scenarioVersions, selectedScenarioVersionId],
  );

  const previousScenarioVersion = useMemo(() => {
    if (!selectedScenarioVersion) return null;
    const index = scenarioVersions.findIndex((version) => version.id === selectedScenarioVersion.id);
    if (index <= 0) return null;
    return scenarioVersions[index - 1] ?? null;
  }, [scenarioVersions, selectedScenarioVersion]);

  return {
    previousScenarioVersion,
    selectedScenarioVersion,
    selectedScenarioVersionId,
    setSelectedScenarioVersionId,
  };
}
