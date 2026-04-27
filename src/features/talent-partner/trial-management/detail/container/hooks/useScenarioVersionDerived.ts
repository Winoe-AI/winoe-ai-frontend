import type { ScenarioVersionItem } from '../../scenario';

type CanApproveParams = {
  trialStatus: string | null;
  selectedScenarioVersion: ScenarioVersionItem | null;
  pendingScenarioVersionId: string | null;
  activeScenarioVersionId: string | null;
};

type CanActivateParams = {
  trialStatus: string | null;
  selectedScenarioVersion: ScenarioVersionItem | null;
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
    return `${selectedScenarioVersionText} only has draft data from this session. Backend does not expose canonical historical content yet, so this version is read-only and cannot be approved.`;
  }
  return `${selectedScenarioVersionText} content is unavailable from the backend. This version is read-only and cannot be edited or approved.`;
}

export function scenarioEditorDisabledReason(
  selectedScenarioVersion: ScenarioVersionItem | null,
  trialStatus: string | null,
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
  if (trialStatus !== 'ready_for_review' && trialStatus !== 'active_inviting') {
    return 'Scenario editing is unavailable in the current trial status.';
  }
  return null;
}

export function canApproveSelectedScenario({
  trialStatus,
  selectedScenarioVersion,
  pendingScenarioVersionId,
  activeScenarioVersionId,
}: CanApproveParams): boolean {
  if (trialStatus !== 'ready_for_review') return false;
  if (!selectedScenarioVersion) return false;
  if (selectedScenarioVersion.contentAvailability !== 'canonical') return false;
  if (selectedScenarioVersion.uiStatus === 'generating') return false;
  if (selectedScenarioVersion.uiStatus === 'approved') return false;
  if (selectedScenarioVersion.isLocked) return false;
  if (pendingScenarioVersionId != null) {
    return selectedScenarioVersion.id === pendingScenarioVersionId;
  }
  if (activeScenarioVersionId == null) return false;
  return selectedScenarioVersion.id === activeScenarioVersionId;
}

export function canActivateSelectedTrial({
  trialStatus,
  selectedScenarioVersion,
}: CanActivateParams): boolean {
  if (trialStatus === 'active_inviting') return false;
  if (!selectedScenarioVersion) return false;
  if (selectedScenarioVersion.contentAvailability !== 'canonical') return false;
  return (
    selectedScenarioVersion.uiStatus === 'approved' ||
    selectedScenarioVersion.uiStatus === 'locked'
  );
}

export function formatScenarioRubricSummary(
  selectedScenarioVersion: ScenarioVersionItem | null,
  rubricSummary: string | null,
  selectedScenarioHasCanonicalContent: boolean,
): string | null {
  if (selectedScenarioVersion && !selectedScenarioHasCanonicalContent)
    return null;
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
