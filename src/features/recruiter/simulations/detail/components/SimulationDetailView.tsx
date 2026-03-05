'use client';
import dynamic from 'next/dynamic';
import { CandidatesSection } from './sections/CandidatesSection';
import { SimulationPlanSection } from './SimulationPlanSection';
import { SimulationDetailHeader } from './SimulationDetailHeader';
import { useInviteModalActions } from './InviteModalActions';
import { TerminateSimulationModal } from './TerminateSimulationModal';
import { CleanupInProgressPanel } from './CleanupInProgressPanel';
import type { SimulationDetailViewProps } from './types';

const SimulationInviteModal = dynamic(
  () =>
    import('./SimulationInviteModal').then((mod) => mod.SimulationInviteModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
        <div className="rounded bg-white px-4 py-3 text-sm text-gray-700 shadow">
          Loading invite form…
        </div>
      </div>
    ),
  },
);

export function SimulationDetailView(props: SimulationDetailViewProps) {
  const { openInviteModal, closeInviteModal } = useInviteModalActions({
    inviteEnabled: props.inviteEnabled,
    resetInviteFlow: props.resetInviteFlow,
    setInviteModalOpen: props.setInviteModalOpen,
  });

  return (
    <div className="flex flex-col gap-4 py-8">
      <SimulationDetailHeader
        simulationId={props.simulationId}
        simulationStatus={props.simulationStatus}
        scenarioVersionLabel={props.scenarioVersionLabel}
        scenarioIdLabel={props.scenarioIdLabel}
        scenarioLocked={props.scenarioLocked}
        scenarioLockedAt={props.scenarioLockedAt}
        titleLabel={props.titleLabel}
        templateKeyLabel={props.templateKeyLabel}
        inviteEnabled={props.inviteEnabled}
        inviteDisabledReason={props.inviteDisabledReason}
        canApprove={props.canApprove}
        approveLoading={props.approveLoading}
        onApprove={props.onApprove}
        regenerateLoading={props.regenerateLoading}
        onRegenerate={props.onRegenerate}
        terminatePending={props.terminatePending}
        onOpenTerminateModal={() => props.setTerminateModalOpen(true)}
        onInvite={openInviteModal}
      />
      <CleanupInProgressPanel cleanupJobIds={props.cleanupJobIds} />
      <SimulationPlanSection
        status={props.simulationStatus}
        scenarioVersionLabel={props.scenarioVersionLabel}
        scenarioIdLabel={props.scenarioIdLabel}
        scenarioLocked={props.scenarioLocked}
        templateKeyLabel={props.templateKeyLabel}
        roleLabel={props.roleLabel}
        stackLabel={props.stackLabel}
        levelLabel={props.levelLabel}
        focusLabel={props.focusLabel}
        companyContextLabel={props.companyContextLabel}
        scenarioLabel={props.scenarioLabel}
        rubricSummary={props.rubricSummary}
        planDays={props.planDays}
        loading={props.planLoading}
        statusCode={props.planStatusCode}
        generating={props.generating}
        actionError={props.actionError}
        retryGenerateLoading={props.retryGenerateLoading}
        onRetryGenerate={props.onRetryGenerate}
        jobFailureMessage={props.jobFailureMessage}
        jobFailureCode={props.jobFailureCode}
        error={props.planError}
        onRetry={props.reloadPlan}
      />
      <CandidatesSection
        loading={props.candidatesLoading}
        error={props.candidatesError}
        onRetry={props.reloadCandidates}
        search={props.search}
        candidates={props.candidates}
        rowStates={props.rowStates}
        onCopy={props.onCopy}
        onResend={props.onResend}
        onCloseManual={props.onCloseManual}
        cooldownNow={props.cooldownNow}
        simulationId={props.simulationId}
        inviteEnabled={props.inviteEnabled}
        inviteDisabledReason={props.inviteDisabledReason}
        onInvite={openInviteModal}
        inviteResendEnabled={props.inviteResendEnabled}
        inviteResendDisabledReason={props.inviteResendDisabledReason}
      />

      {props.inviteModalOpen ? (
        <SimulationInviteModal
          simulationId={props.simulationId}
          open={props.inviteModalOpen}
          inviteFlowState={props.inviteFlowState}
          onClose={closeInviteModal}
          onSubmit={props.submitInvite}
        />
      ) : null}

      {props.terminateModalOpen ? (
        <TerminateSimulationModal
          open={props.terminateModalOpen}
          pending={props.terminatePending}
          onClose={() => props.setTerminateModalOpen(false)}
          onConfirm={props.onTerminate}
        />
      ) : null}
    </div>
  );
}
