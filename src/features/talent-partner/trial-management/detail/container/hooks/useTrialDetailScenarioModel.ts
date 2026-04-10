import type { ToastInput } from '@/shared/notifications/types';
import type { useTrialLabels } from '../../hooks/useTrialLabels';
import type { TrialDetailPreview } from '../../utils/detailUtils';
import type { useTrialDetailCandidates } from './useTrialDetailCandidates';
import type { useTrialDetailState } from './useTrialDetailState';
import { useTrialScenarioActions } from './useTrialScenarioActions';
import { useTrialScenarioVersions } from './useTrialScenarioVersions';
import { useTrialDetailCallbacks } from './useTrialDetailCallbacks';

type NotifyFn = (payload: ToastInput) => void;

type UseTrialDetailScenarioModelArgs = {
  trialId: string;
  detail: TrialDetailPreview | null;
  labels: ReturnType<typeof useTrialLabels>;
  state: ReturnType<typeof useTrialDetailState>;
  isGenerating: boolean;
  reloadPlan: () => Promise<void>;
  notify: NotifyFn;
  inviteModal: ReturnType<typeof useTrialDetailCandidates>['inviteModal'];
};

export function useTrialDetailScenarioModel({
  trialId,
  detail,
  labels,
  state,
  isGenerating,
  reloadPlan,
  notify,
  inviteModal,
}: UseTrialDetailScenarioModelArgs) {
  const scenario = useTrialScenarioVersions({
    trialId,
    detail,
    planDays: labels.planDays,
    scenarioLabel: labels.scenarioLabel,
    rubricSummary: labels.rubricSummary,
    trialStatus: state.trialStatus,
    isGenerating,
    refreshPlan: reloadPlan,
    setActionError: state.setActionError,
  });
  const scenarioActions = useTrialScenarioActions({
    trialId,
    trialStatus: state.trialStatus,
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
  const callbacks = useTrialDetailCallbacks({
    trialId,
    trialStatus: state.trialStatus,
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
