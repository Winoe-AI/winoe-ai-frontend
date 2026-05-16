import { TrialDetailHeader } from './TrialDetailHeader';
import type { TrialDetailViewProps } from './types';

type TrialDetailHeaderSectionProps = {
  props: TrialDetailViewProps;
  onInvite: () => void;
  onRevealScenarioWorkbench: () => void;
};

export function TrialDetailHeaderSection({
  props,
  onInvite,
  onRevealScenarioWorkbench,
}: TrialDetailHeaderSectionProps) {
  const commandCenterActive =
    props.trialStatus === 'active_inviting' &&
    !props.generating &&
    !props.jobFailureMessage;

  return (
    <TrialDetailHeader
      trialId={props.trialId}
      trialStatus={props.trialStatus}
      selectedScenarioStatusForDisplay={props.selectedScenarioStatusForDisplay}
      scenarioVersionLabel={props.scenarioVersionLabel}
      scenarioIdLabel={props.scenarioIdLabel}
      scenarioLocked={props.scenarioLocked}
      scenarioLockedAt={props.scenarioLockedAt}
      titleLabel={props.titleLabel}
      roleLabel={props.roleLabel}
      preferredLanguageFrameworkLabel={props.preferredLanguageFrameworkLabel}
      commandCenterActive={commandCenterActive}
      onRevealScenarioWorkbench={onRevealScenarioWorkbench}
      inviteEnabled={props.inviteEnabled}
      inviteDisabledReason={props.inviteDisabledReason}
      canApprove={props.canApprove}
      approveButtonLabel={props.approveButtonLabel}
      approveLoading={props.approveLoading}
      onApprove={props.onApprove}
      canActivate={props.canActivate}
      activateButtonLabel={props.activateButtonLabel}
      activateLoading={props.activateLoading}
      onActivate={props.onActivate}
      regenerateLoading={props.regenerateLoading}
      regenerateDisabled={props.regenerateDisabled}
      onRegenerate={props.onRegenerate}
      terminatePending={props.terminatePending}
      onOpenTerminateModal={() => props.setTerminateModalOpen(true)}
      onInvite={onInvite}
    />
  );
}
