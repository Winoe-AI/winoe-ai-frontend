import { SimulationDetailHeader } from './SimulationDetailHeader';
import type { SimulationDetailViewProps } from './types';

type SimulationDetailHeaderSectionProps = {
  props: SimulationDetailViewProps;
  onInvite: () => void;
};

export function SimulationDetailHeaderSection({
  props,
  onInvite,
}: SimulationDetailHeaderSectionProps) {
  return (
    <SimulationDetailHeader
      simulationId={props.simulationId}
      simulationStatus={props.simulationStatus}
      selectedScenarioStatusForDisplay={props.selectedScenarioStatusForDisplay}
      scenarioVersionLabel={props.scenarioVersionLabel}
      scenarioIdLabel={props.scenarioIdLabel}
      scenarioLocked={props.scenarioLocked}
      scenarioLockedAt={props.scenarioLockedAt}
      titleLabel={props.titleLabel}
      templateKeyLabel={props.templateKeyLabel}
      inviteEnabled={props.inviteEnabled}
      inviteDisabledReason={props.inviteDisabledReason}
      canApprove={props.canApprove}
      approveButtonLabel={props.approveButtonLabel}
      approveLoading={props.approveLoading}
      onApprove={props.onApprove}
      regenerateLoading={props.regenerateLoading}
      regenerateDisabled={props.regenerateDisabled}
      onRegenerate={props.onRegenerate}
      terminatePending={props.terminatePending}
      onOpenTerminateModal={() => props.setTerminateModalOpen(true)}
      onInvite={onInvite}
    />
  );
}
