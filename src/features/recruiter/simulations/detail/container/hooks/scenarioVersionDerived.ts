import type { ScenarioVersionItem } from '../../scenario';

type CanApproveParams = {
  simulationStatus: string | null;
  selectedScenarioVersion: ScenarioVersionItem | null;
  pendingScenarioVersionId: string | null;
  activeScenarioVersionId: string | null;
};

export function scenarioContentUnavailableMessage(
  selectedScenarioVersion: ScenarioVersionItem | null,
  selectedScenarioVersionText: string,
): string | null {
  if (!selectedScenarioVersion) return null;
  if (selectedScenarioVersion.contentAvailability === 'canonical') return null;
  if (selectedScenarioVersion.uiStatus === 'generating') {
    return `${selectedScenarioVersionText} is still generating. Preview, editing, and approval stay disabled until canonical content is available.`;
  }
  if (selectedScenarioVersion.contentAvailability === 'local_only') {
    return `${selectedScenarioVersionText} only has local draft data from this session. Backend does not expose canonical historical content yet, so this version is read-only and cannot be approved.`;
  }
  return `${selectedScenarioVersionText} content is unavailable from the backend. This version is read-only and cannot be edited or approved.`;
}

export function scenarioEditorDisabledReason(
  selectedScenarioVersion: ScenarioVersionItem | null,
  simulationStatus: string | null,
): string | null {
  if (!selectedScenarioVersion) return 'Select a scenario version to edit.';
  if (selectedScenarioVersion.uiStatus === 'generating') {
    return 'Generating versions cannot be edited yet.';
  }
  if (selectedScenarioVersion.contentAvailability !== 'canonical') {
    return 'This version cannot be edited because canonical scenario content is unavailable.';
  }
  if (selectedScenarioVersion.isLocked) {
    return 'This version is locked because invites exist.';
  }
  if (
    simulationStatus !== 'ready_for_review' &&
    simulationStatus !== 'active_inviting'
  ) {
    return 'Scenario editing is unavailable in the current simulation status.';
  }
  return null;
}

export function canApproveSelectedScenario({
  simulationStatus,
  selectedScenarioVersion,
  pendingScenarioVersionId,
  activeScenarioVersionId,
}: CanApproveParams): boolean {
  if (simulationStatus !== 'ready_for_review') return false;
  if (!selectedScenarioVersion) return false;
  if (selectedScenarioVersion.contentAvailability !== 'canonical') return false;
  if (selectedScenarioVersion.uiStatus === 'generating') return false;
  if (selectedScenarioVersion.isLocked) return false;
  if (pendingScenarioVersionId != null) {
    return selectedScenarioVersion.id === pendingScenarioVersionId;
  }
  if (activeScenarioVersionId == null) return false;
  return selectedScenarioVersion.id === activeScenarioVersionId;
}

export function formatScenarioRubricSummary(
  selectedScenarioVersion: ScenarioVersionItem | null,
  rubricSummary: string | null,
  selectedScenarioHasCanonicalContent: boolean,
): string | null {
  if (selectedScenarioVersion && !selectedScenarioHasCanonicalContent) return null;
  const rubric = selectedScenarioVersion?.rubric;
  if (rubric && Object.keys(rubric).length) {
    try {
      return `\`\`\`json\n${JSON.stringify(rubric, null, 2)}\n\`\`\``;
    } catch {
      return rubricSummary;
    }
  }
  return rubricSummary;
}
