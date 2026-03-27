import { useState } from 'react';
import { useApproveScenarioCallback } from './useApproveScenarioCallback';
import { useRegenerateScenarioCallback } from './useRegenerateScenarioCallback';
import { useRetryGenerateCallback } from './useRetryGenerateCallback';
import { useSaveScenarioEditsCallback } from './useSaveScenarioEditsCallback';
import { useScenarioEditorDraftState } from './useScenarioEditorDraftState';
import { useSelectScenarioVersionCallback } from './useSelectScenarioVersionCallback';
import type { UseSimulationScenarioActionsArgs } from './useSimulationScenarioActions.types';

export function useSimulationScenarioActions(
  args: UseSimulationScenarioActionsArgs,
) {
  const [approveLoading, setApproveLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [retryGenerateLoading, setRetryGenerateLoading] = useState(false);
  const regenerateDisabled = Boolean(
    regenerateLoading || args.pendingScenarioVersionId != null,
  );
  const { selectedScenarioEditorDraft, onScenarioEditorDraftChange } =
    useScenarioEditorDraftState({
      selectedScenarioVersionId: args.selectedScenarioVersionId,
    });
  const onSelectScenarioVersion = useSelectScenarioVersionCallback({
    scenarioEditorSaveError: args.scenarioEditorSaveError,
    setScenarioEditorSaveError: args.setScenarioEditorSaveError,
    setScenarioEditorFieldErrors: args.setScenarioEditorFieldErrors,
    setScenarioLockBannerMessage: args.setScenarioLockBannerMessage,
    setSelectedScenarioVersionId: args.setSelectedScenarioVersionId,
  });
  const onSaveScenarioEdits = useSaveScenarioEditsCallback({
    simulationId: args.simulationId,
    selectedScenarioVersion: args.selectedScenarioVersion,
    scenarioEditorDisabled: args.scenarioEditorDisabled,
    scenarioEditorSaving: args.scenarioEditorSaving,
    setScenarioEditorSaving: args.setScenarioEditorSaving,
    setScenarioEditorSaveError: args.setScenarioEditorSaveError,
    setScenarioEditorFieldErrors: args.setScenarioEditorFieldErrors,
    setScenarioLockBannerMessage: args.setScenarioLockBannerMessage,
    setScenarioVersionSnapshots: args.setScenarioVersionSnapshots,
    refreshPlan: args.refreshPlan,
  });
  const onApprove = useApproveScenarioCallback({
    canApprove: args.canApprove,
    selectedScenarioVersion: args.selectedScenarioVersion,
    selectedScenarioVersionIndex: args.selectedScenarioVersionIndex,
    simulationId: args.simulationId,
    simulationStatus: args.simulationStatus,
    setActionError: args.setActionError,
    setStatusOverride: args.setStatusOverride,
    setPendingRegeneration: args.setPendingRegeneration,
    refreshPlan: args.refreshPlan,
    approveLoading,
    setApproveLoading,
  });
  const onRegenerate = useRegenerateScenarioCallback({
    simulationId: args.simulationId,
    simulationStatus: args.simulationStatus,
    selectedScenarioVersionIndex: args.selectedScenarioVersionIndex,
    scenarioVersionSnapshots: args.scenarioVersionSnapshots,
    setActionError: args.setActionError,
    setScenarioVersionSnapshots: args.setScenarioVersionSnapshots,
    setSelectedScenarioVersionId: args.setSelectedScenarioVersionId,
    setScenarioEditorSaveError: args.setScenarioEditorSaveError,
    setScenarioEditorFieldErrors: args.setScenarioEditorFieldErrors,
    setScenarioLockBannerMessage: args.setScenarioLockBannerMessage,
    setPendingRegeneration: args.setPendingRegeneration,
    refreshPlan: args.refreshPlan,
    regenerateLoading,
    regenerateDisabled,
    setRegenerateLoading,
  });
  const onRetryGenerate = useRetryGenerateCallback({
    simulationId: args.simulationId,
    simulationStatus: args.simulationStatus,
    selectedScenarioVersionIndex: args.selectedScenarioVersionIndex,
    setActionError: args.setActionError,
    refreshPlan: args.refreshPlan,
    retryGenerateLoading,
    setRetryGenerateLoading,
  });
  return {
    approveLoading,
    regenerateLoading,
    regenerateDisabled,
    retryGenerateLoading,
    selectedScenarioEditorDraft,
    onScenarioEditorDraftChange,
    onSelectScenarioVersion,
    onSaveScenarioEdits,
    onApprove,
    onRegenerate,
    onRetryGenerate,
  };
}
