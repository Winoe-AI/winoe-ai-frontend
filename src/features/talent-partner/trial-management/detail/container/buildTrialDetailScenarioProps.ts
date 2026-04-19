import type { useTrialLabels } from '../hooks/useTrialLabels';
import type { useTrialScenarioActions } from './hooks/useTrialScenarioActions';
import type { useTrialScenarioVersions } from './hooks/useTrialScenarioVersions';

type BuildScenarioPropsArgs = {
  scenario: ReturnType<typeof useTrialScenarioVersions>;
  scenarioActions: ReturnType<typeof useTrialScenarioActions>;
  labels: ReturnType<typeof useTrialLabels>;
  approveButtonLabel: string;
  planLoading: boolean;
  planStatusCode: number | null;
  isGenerating: boolean;
  planError: string | null;
  reloadPlan: () => Promise<void>;
};

export function buildTrialDetailScenarioProps({
  scenario,
  scenarioActions,
  labels,
  approveButtonLabel,
  planLoading,
  planStatusCode,
  isGenerating,
  planError,
  reloadPlan,
}: BuildScenarioPropsArgs) {
  return {
    selectedScenarioStatusForDisplay: scenario.selectedScenarioStatusForDisplay,
    scenarioVersionLabel: scenario.selectedScenarioVersionText,
    scenarioIdLabel: scenario.selectedScenarioVersion?.id ?? null,
    scenarioLocked: scenario.selectedScenarioVersion?.isLocked ?? false,
    scenarioLockedAt: scenario.selectedScenarioVersion?.lockedAt ?? null,
    scenarioVersions: scenario.scenarioVersions,
    selectedScenarioVersionId: scenario.selectedScenarioVersionId,
    onSelectScenarioVersion: scenarioActions.onSelectScenarioVersion,
    selectedScenarioVersion: scenario.selectedScenarioVersion,
    previousScenarioVersion: scenario.previousScenarioVersion,
    scenarioLockBannerMessage: scenario.effectiveLockBannerMessage,
    scenarioContentUnavailableMessage:
      scenario.scenarioContentUnavailableMessage,
    scenarioGeneratingLabel: scenario.scenarioGeneratingLabel,
    scenarioEditorDisabled: scenario.scenarioEditorDisabled,
    scenarioEditorDisabledReason: scenario.scenarioEditorDisabledReason,
    scenarioEditorSaving: scenario.scenarioEditorSaving,
    scenarioEditorSaveError: scenario.scenarioEditorSaveError,
    scenarioEditorFieldErrors: scenario.scenarioEditorFieldErrors,
    scenarioEditorDraft: scenarioActions.selectedScenarioEditorDraft,
    onScenarioEditorDraftChange: scenarioActions.onScenarioEditorDraftChange,
    onSaveScenarioEdits: scenarioActions.onSaveScenarioEdits,
    canApprove: scenario.canApprove,
    approveButtonLabel,
    approveLoading: scenarioActions.approveLoading,
    onApprove: scenarioActions.onApprove,
    regenerateLoading: scenarioActions.regenerateLoading,
    regenerateDisabled: scenarioActions.regenerateDisabled,
    onRegenerate: scenarioActions.onRegenerate,
    retryGenerateLoading: scenarioActions.retryGenerateLoading,
    onRetryGenerate: scenarioActions.onRetryGenerate,
    titleLabel: labels.titleLabel,
    roleLabel: labels.roleLabel,
    preferredLanguageFrameworkLabel: labels.preferredLanguageFrameworkLabel,
    levelLabel: labels.levelLabel,
    focusLabel: labels.focusLabel,
    companyContextLabel: labels.companyContextLabel,
    notesLabel: labels.notesLabel,
    scenarioLabel: scenario.displayedScenarioLabel,
    rubricSummary: scenario.displayedRubricSummary,
    scenarioContentUnavailableMessageForPlan:
      scenario.scenarioContentUnavailableMessage,
    planDays: scenario.displayedPlanDays,
    planLoading,
    planStatusCode,
    generating:
      isGenerating ||
      scenario.selectedScenarioVersion?.uiStatus === 'generating',
    jobFailureMessage: scenario.scenarioFailureMessage,
    jobFailureCode: scenario.scenarioFailureCode,
    planError,
    reloadPlan,
    canActivate: scenario.canActivate,
  };
}
