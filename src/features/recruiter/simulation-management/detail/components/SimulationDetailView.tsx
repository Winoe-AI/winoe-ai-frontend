'use client';
import { useInviteModalActions } from './InviteModalActions';
import { CleanupInProgressPanel } from './CleanupInProgressPanel';
import { SimulationAiOverridesPanel } from './SimulationAiOverridesPanel';
import { SimulationDetailCandidatesPanel } from './SimulationDetailCandidatesPanel';
import { SimulationDetailHeaderSection } from './SimulationDetailHeaderSection';
import { SimulationDetailModals } from './SimulationDetailModals';
import { SimulationDetailPlanPanel } from './SimulationDetailPlanPanel';
import { SimulationDetailScenarioControls } from './SimulationDetailScenarioControls';
import type { SimulationDetailViewProps } from './types';
import { useDeferredScenarioControls } from './useDeferredScenarioControls';

export function SimulationDetailView(props: SimulationDetailViewProps) {
  const { openInviteModal, closeInviteModal } = useInviteModalActions({
    inviteEnabled: props.inviteEnabled,
    resetInviteFlow: props.resetInviteFlow,
    setInviteModalOpen: props.setInviteModalOpen,
  });
  const showScenarioControls = useDeferredScenarioControls();

  return (
    <div className="flex flex-col gap-4 py-8">
      <SimulationDetailHeaderSection props={props} onInvite={openInviteModal} />
      <CleanupInProgressPanel cleanupJobIds={props.cleanupJobIds} />
      <SimulationDetailScenarioControls
        props={props}
        showScenarioControls={showScenarioControls}
      />
      {props.aiConfig ? (
        <SimulationAiOverridesPanel
          simulationId={props.simulationId}
          aiConfig={props.aiConfig}
          onSaved={props.reloadPlan}
        />
      ) : null}
      <SimulationDetailPlanPanel props={props} />
      <SimulationDetailCandidatesPanel
        props={props}
        onInvite={openInviteModal}
      />
      <SimulationDetailModals
        props={props}
        closeInviteModal={closeInviteModal}
      />
    </div>
  );
}
