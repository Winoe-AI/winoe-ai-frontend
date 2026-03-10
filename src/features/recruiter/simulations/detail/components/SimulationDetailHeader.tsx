'use client';

import { SimulationDetailHeaderCore } from './SimulationDetailHeaderCore';
import type { SimulationDetailViewProps } from './types';

type Props = Pick<
  SimulationDetailViewProps,
  | 'simulationId'
  | 'simulationStatus'
  | 'selectedScenarioStatusForDisplay'
  | 'scenarioVersionLabel'
  | 'scenarioIdLabel'
  | 'scenarioLocked'
  | 'scenarioLockedAt'
  | 'templateKeyLabel'
  | 'titleLabel'
  | 'inviteEnabled'
  | 'inviteDisabledReason'
  | 'canApprove'
  | 'approveButtonLabel'
  | 'approveLoading'
  | 'onApprove'
  | 'regenerateLoading'
  | 'regenerateDisabled'
  | 'onRegenerate'
  | 'terminatePending'
> & { onInvite: () => void; onOpenTerminateModal: () => void };

export function SimulationDetailHeader({
  simulationId,
  simulationStatus,
  selectedScenarioStatusForDisplay,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
  scenarioLockedAt,
  templateKeyLabel,
  titleLabel,
  inviteEnabled,
  inviteDisabledReason,
  canApprove,
  approveButtonLabel,
  approveLoading,
  onApprove,
  regenerateLoading,
  regenerateDisabled,
  onRegenerate,
  terminatePending,
  onOpenTerminateModal,
  onInvite,
}: Props) {
  return (
    <SimulationDetailHeaderCore
      simulationId={simulationId}
      simulationStatus={simulationStatus}
      selectedScenarioStatusForDisplay={selectedScenarioStatusForDisplay}
      scenarioVersionLabel={scenarioVersionLabel}
      scenarioIdLabel={scenarioIdLabel}
      scenarioLocked={scenarioLocked}
      scenarioLockedAt={scenarioLockedAt}
      title={titleLabel}
      templateKey={templateKeyLabel}
      inviteEnabled={inviteEnabled}
      inviteDisabledReason={inviteDisabledReason}
      canApprove={canApprove}
      approveButtonLabel={approveButtonLabel}
      approveLoading={approveLoading}
      onApprove={onApprove}
      regenerateLoading={regenerateLoading}
      regenerateDisabled={regenerateDisabled}
      onRegenerate={onRegenerate}
      terminatePending={terminatePending}
      onOpenTerminateModal={onOpenTerminateModal}
      onInvite={onInvite}
    />
  );
}
