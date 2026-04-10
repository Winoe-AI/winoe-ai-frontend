'use client';

import { useParams } from 'next/navigation';
import { useNotifications } from '@/shared/notifications';
import { TrialDetailBlockedState } from './components/TrialDetailBlockedState';
import { TrialDetailView } from './components/TrialDetailView';
import { useTrialLabels } from './hooks/useTrialLabels';
import { useTrialPlan } from './hooks/useTrialPlan';
import { __testables } from './trialDetailTestables';
import { buildTrialDetailViewProps } from './container/buildTrialDetailViewProps';
import { useTrialDetailCandidates } from './container/hooks/useTrialDetailCandidates';
import { useTrialDetailScenarioModel } from './container/hooks/useTrialDetailScenarioModel';
import { useTrialDetailState } from './container/hooks/useTrialDetailState';

export default function TrialDetailContainer() {
  const trialId = useParams<{ id: string }>().id;
  const { notify } = useNotifications();
  const {
    detail,
    plan,
    loading: planLoading,
    error: planError,
    statusCode: planStatusCode,
    isGenerating,
    reload: reloadPlan,
  } = useTrialPlan({ trialId });

  const state = useTrialDetailState({
    trialId,
    detailStatus: detail?.status ?? null,
    detailStatusRaw: detail?.statusRaw ?? null,
    hasDetail: detail != null,
    planStatusCode,
    planLoading,
  });

  const candidates = useTrialDetailCandidates({
    trialId,
    candidatesEnabled: state.candidatesEnabled,
    inviteResendEnabled: state.inviteResendEnabled,
    inviteResendDisabledReason: state.inviteResendDisabledReason,
  });

  const labels = useTrialLabels(plan, detail, trialId);
  const scenarioModel = useTrialDetailScenarioModel({
    trialId,
    detail,
    labels,
    state,
    isGenerating,
    reloadPlan,
    notify,
    inviteModal: candidates.inviteModal,
  });

  if (state.pageBlocked && state.blockedStatusCode) {
    return <TrialDetailBlockedState statusCode={state.blockedStatusCode} />;
  }

  const viewProps = buildTrialDetailViewProps({
    trialId,
    trialStatus: state.trialStatus,
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

  return <TrialDetailView {...viewProps} />;
}

export { __testables };
