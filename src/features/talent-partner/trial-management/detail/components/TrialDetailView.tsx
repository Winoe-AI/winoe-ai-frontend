'use client';
import { useInviteModalActions } from './InviteModalActions';
import { CleanupInProgressPanel } from './CleanupInProgressPanel';
import { TrialAiOverridesPanel } from './TrialAiOverridesPanel';
import { TrialDetailCandidatesPanel } from './TrialDetailCandidatesPanel';
import { TrialDetailHeaderSection } from './TrialDetailHeaderSection';
import { TrialDetailModals } from './TrialDetailModals';
import { TrialDetailPlanPanel } from './TrialDetailPlanPanel';
import { TrialDetailScenarioControls } from './TrialDetailScenarioControls';
import type { TrialDetailViewProps } from './types';
import { useDeferredScenarioControls } from './useDeferredScenarioControls';

export function TrialDetailView(props: TrialDetailViewProps) {
  const { openInviteModal, closeInviteModal } = useInviteModalActions({
    inviteEnabled: props.inviteEnabled,
    resetInviteFlow: props.resetInviteFlow,
    setInviteModalOpen: props.setInviteModalOpen,
  });
  const showScenarioControls = useDeferredScenarioControls();

  return (
    <div className="flex flex-col gap-4 py-8">
      <TrialDetailHeaderSection props={props} onInvite={openInviteModal} />
      <CleanupInProgressPanel cleanupJobIds={props.cleanupJobIds} />
      <TrialDetailScenarioControls
        props={props}
        showScenarioControls={showScenarioControls}
      />
      {props.aiConfig ? (
        <TrialAiOverridesPanel
          trialId={props.trialId}
          aiConfig={props.aiConfig}
          onSaved={props.reloadPlan}
        />
      ) : null}
      <TrialDetailPlanPanel props={props} />
      <TrialDetailCandidatesPanel props={props} onInvite={openInviteModal} />
      <TrialDetailModals props={props} closeInviteModal={closeInviteModal} />
    </div>
  );
}
