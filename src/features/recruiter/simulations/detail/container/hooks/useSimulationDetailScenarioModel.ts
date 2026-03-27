import type { ToastInput } from '@/shared/notifications/types';
import type { useSimulationLabels } from '../../hooks/useSimulationLabels';
import type { SimulationDetailPreview } from '../../utils/detail';
import type { useSimulationDetailCandidates } from './useSimulationDetailCandidates';
import type { useSimulationDetailState } from './useSimulationDetailState';
import { useSimulationScenarioActions } from './useSimulationScenarioActions';
import { useSimulationScenarioVersions } from './useSimulationScenarioVersions';
import { useSimulationDetailCallbacks } from './useSimulationDetailCallbacks';

type NotifyFn = (payload: ToastInput) => void;

type UseSimulationDetailScenarioModelArgs = {
  simulationId: string;
  detail: SimulationDetailPreview | null;
  labels: ReturnType<typeof useSimulationLabels>;
  state: ReturnType<typeof useSimulationDetailState>;
  isGenerating: boolean;
  reloadPlan: () => Promise<void>;
  notify: NotifyFn;
  inviteModal: ReturnType<typeof useSimulationDetailCandidates>['inviteModal'];
};

export function useSimulationDetailScenarioModel({
  simulationId,
  detail,
  labels,
  state,
  isGenerating,
  reloadPlan,
  notify,
  inviteModal,
}: UseSimulationDetailScenarioModelArgs) {
  const scenario = useSimulationScenarioVersions({
    simulationId,
    detail,
    planDays: labels.planDays,
    scenarioLabel: labels.scenarioLabel,
    rubricSummary: labels.rubricSummary,
    simulationStatus: state.simulationStatus,
    isGenerating,
    refreshPlan: reloadPlan,
    setActionError: state.setActionError,
  });
  const scenarioActions = useSimulationScenarioActions({
    simulationId,
    simulationStatus: state.simulationStatus,
    selectedScenarioVersionId: scenario.selectedScenarioVersionId,
    selectedScenarioVersionIndex: scenario.selectedScenarioVersionIndex,
    selectedScenarioVersion: scenario.selectedScenarioVersion,
    canApprove: scenario.canApprove,
    pendingScenarioVersionId: scenario.pendingScenarioVersionId,
    refreshPlan: reloadPlan,
    setActionError: state.setActionError,
    setStatusOverride: state.setStatusOverride,
    scenarioVersionSnapshots: scenario.scenarioVersionSnapshots,
    setScenarioVersionSnapshots: scenario.setScenarioVersionSnapshots,
    scenarioEditorDisabled: scenario.scenarioEditorDisabled,
    scenarioEditorSaving: scenario.scenarioEditorSaving,
    setScenarioEditorSaving: scenario.setScenarioEditorSaving,
    scenarioEditorSaveError: scenario.scenarioEditorSaveError,
    setScenarioEditorSaveError: scenario.setScenarioEditorSaveError,
    setScenarioEditorFieldErrors: scenario.setScenarioEditorFieldErrors,
    setScenarioLockBannerMessage: scenario.setScenarioLockBannerMessage,
    setPendingRegeneration: scenario.setPendingRegeneration,
    setSelectedScenarioVersionId: scenario.setSelectedScenarioVersionId,
  });
  const callbacks = useSimulationDetailCallbacks({
    simulationId,
    simulationStatus: state.simulationStatus,
    selectedScenarioVersionIndex: scenario.selectedScenarioVersionIndex,
    selectedScenarioVersionText: scenario.selectedScenarioVersionText,
    hasSelectedScenarioVersion: scenario.selectedScenarioVersion != null,
    terminatePending: state.terminatePending,
    terminateModalOpen: state.terminateModalOpen,
    isTerminated: state.isTerminated,
    inviteDisabledReason: state.inviteDisabledReason,
    closeInviteModal: inviteModal.close,
    submitInvite: inviteModal.submitInvite,
    notify,
    setActionError: state.setActionError,
    setTerminatePending: state.setTerminatePending,
    setStatusOverride: state.setStatusOverride,
    setCleanupJobIds: state.setCleanupJobIds,
    setTerminateModalOpen: state.setTerminateModalOpen,
    setTerminateBlockedStatus: state.setTerminateBlockedStatus,
  });

  return { scenario, scenarioActions, callbacks };
}
