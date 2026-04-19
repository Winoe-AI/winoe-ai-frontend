import { TrialDetailHeader } from './TrialDetailHeader';
import type { TrialDetailViewProps } from './types';

type TrialDetailHeaderSectionProps = {
  props: TrialDetailViewProps;
  onInvite: () => void;
};

export function TrialDetailHeaderSection({
  props,
  onInvite,
}: TrialDetailHeaderSectionProps) {
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
