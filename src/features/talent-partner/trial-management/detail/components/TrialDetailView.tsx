'use client';
import { useInviteModalActions } from './InviteModalActions';
import { CleanupInProgressPanel } from './CleanupInProgressPanel';
import { TrialAiOverridesPanel } from './TrialAiOverridesPanel';
import { TrialDetailHeaderSection } from './TrialDetailHeaderSection';
import { TrialDetailModals } from './TrialDetailModals';
import { TrialDetailPlanPanel } from './TrialDetailPlanPanel';
import { TrialDetailTabs } from './TrialDetailTabs';
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

  const commandSurfaceFirst =
    props.trialStatus === 'active_inviting' &&
    !props.generating &&
    !props.jobFailureMessage;

  const scenarioBlockInner = (
    <TrialDetailScenarioControls
      props={props}
      showScenarioControls={showScenarioControls}
    />
  );

  const scenarioBlock = commandSurfaceFirst ? (
    <details
      id="trial-scenario-workbench"
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm open:ring-1 open:ring-subtle"
      data-testid="trial-scenario-workbench-details"
    >
      <summary className="cursor-pointer text-sm font-medium text-primary">
        Advanced — scenario workbench
      </summary>
      <div className="mt-4">{scenarioBlockInner}</div>
    </details>
  ) : (
    <div id="trial-scenario-workbench">{scenarioBlockInner}</div>
  );

  const tabsBlock =
    !props.generating && !props.jobFailureMessage ? (
      <TrialDetailTabs props={props} onInvite={openInviteModal} />
    ) : null;

  return (
    <div className="flex flex-col gap-4 py-8">
      <TrialDetailHeaderSection
        props={props}
        onInvite={openInviteModal}
        onRevealScenarioWorkbench={() => {
          const anchor = document.getElementById('trial-scenario-workbench');
          anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
      {props.planError && !props.generating ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {props.planError}
        </div>
      ) : null}
      {props.actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {props.actionError}
        </div>
      ) : null}
      <CleanupInProgressPanel cleanupJobIds={props.cleanupJobIds} />
      {props.generating || props.jobFailureMessage ? (
        <TrialDetailPlanPanel props={props} />
      ) : commandSurfaceFirst ? (
        <>
          {tabsBlock}
          {scenarioBlock}
        </>
      ) : (
        <>
          {scenarioBlock}
          {tabsBlock}
        </>
      )}
      {props.aiConfig ? (
        <TrialAiOverridesPanel
          trialId={props.trialId}
          aiConfig={props.aiConfig}
          onSaved={props.reloadPlan}
        />
      ) : null}
      <TrialDetailModals props={props} closeInviteModal={closeInviteModal} />
    </div>
  );
}
