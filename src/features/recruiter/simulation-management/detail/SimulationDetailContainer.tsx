'use client';

import { useParams } from 'next/navigation';
import { useNotifications } from '@/shared/notifications';
import { SimulationDetailBlockedState } from './components/SimulationDetailBlockedState';
import { SimulationDetailView } from './components/SimulationDetailView';
import { useSimulationLabels } from './hooks/useSimulationLabels';
import { useSimulationPlan } from './hooks/useSimulationPlan';
import { __testables } from './simulationDetailTestables';
import { buildSimulationDetailViewProps } from './container/buildSimulationDetailViewProps';
import { useSimulationDetailCandidates } from './container/hooks/useSimulationDetailCandidates';
import { useSimulationDetailScenarioModel } from './container/hooks/useSimulationDetailScenarioModel';
import { useSimulationDetailState } from './container/hooks/useSimulationDetailState';

export default function SimulationDetailContainer() {
  const simulationId = useParams<{ id: string }>().id;
  const { notify } = useNotifications();
  const {
    detail,
    plan,
    loading: planLoading,
    error: planError,
    statusCode: planStatusCode,
    isGenerating,
    reload: reloadPlan,
  } = useSimulationPlan({ simulationId });

  const state = useSimulationDetailState({
    simulationId,
    detailStatus: detail?.status ?? null,
    detailStatusRaw: detail?.statusRaw ?? null,
    hasDetail: detail != null,
    planStatusCode,
    planLoading,
  });

  const candidates = useSimulationDetailCandidates({
    simulationId,
    candidatesEnabled: state.candidatesEnabled,
    inviteResendEnabled: state.inviteResendEnabled,
    inviteResendDisabledReason: state.inviteResendDisabledReason,
  });

  const labels = useSimulationLabels(plan, detail, simulationId);
  const scenarioModel = useSimulationDetailScenarioModel({
    simulationId,
    detail,
    labels,
    state,
    isGenerating,
    reloadPlan,
    notify,
    inviteModal: candidates.inviteModal,
  });

  if (state.pageBlocked && state.blockedStatusCode) {
    return (
      <SimulationDetailBlockedState statusCode={state.blockedStatusCode} />
    );
  }

  const viewProps = buildSimulationDetailViewProps({
    simulationId,
    simulationStatus: state.simulationStatus,
    actionError: state.actionError,
    terminatePending: state.terminatePending,
    terminateModalOpen: state.terminateModalOpen,
    setTerminateModalOpen: scenarioModel.callbacks.onSetTerminateModalOpen,
    onTerminate: scenarioModel.callbacks.onTerminate,
    cleanupJobIds: state.cleanupJobIds,
    inviteEnabled: state.inviteEnabled,
    inviteDisabledReason: state.inviteDisabledReason,
    inviteResendEnabled: state.inviteResendEnabled,
    inviteResendDisabledReason: state.inviteResendDisabledReason,
    scenario: scenarioModel.scenario,
    scenarioActions: scenarioModel.scenarioActions,
    labels,
    aiConfig: detail?.aiConfig ?? null,
    approveButtonLabel: scenarioModel.callbacks.approveButtonLabel,
    planLoading,
    planStatusCode,
    isGenerating,
    planError,
    reloadPlan,
    candidatesModel: candidates,
    onSubmitInvite: scenarioModel.callbacks.onSubmitInvite,
  });

  return <SimulationDetailView {...viewProps} />;
}

export { __testables };
