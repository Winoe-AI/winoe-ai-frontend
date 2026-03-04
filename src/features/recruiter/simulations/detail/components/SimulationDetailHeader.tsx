'use client';

import { SimulationDetailHeaderCore } from './SimulationDetailHeaderCore';
import type { SimulationDetailViewProps } from './types';

type Props = Pick<
  SimulationDetailViewProps,
  | 'simulationId'
  | 'simulationStatus'
  | 'scenarioVersionLabel'
  | 'scenarioIdLabel'
  | 'scenarioLocked'
  | 'scenarioLockedAt'
  | 'templateKeyLabel'
  | 'titleLabel'
  | 'inviteEnabled'
  | 'inviteDisabledReason'
  | 'canApprove'
  | 'approveLoading'
  | 'onApprove'
  | 'regenerateLoading'
  | 'onRegenerate'
> & { onInvite: () => void };

export function SimulationDetailHeader({
  simulationId,
  simulationStatus,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
  scenarioLockedAt,
  templateKeyLabel,
  titleLabel,
  inviteEnabled,
  inviteDisabledReason,
  canApprove,
  approveLoading,
  onApprove,
  regenerateLoading,
  onRegenerate,
  onInvite,
}: Props) {
  return (
    <SimulationDetailHeaderCore
      simulationId={simulationId}
      simulationStatus={simulationStatus}
      scenarioVersionLabel={scenarioVersionLabel}
      scenarioIdLabel={scenarioIdLabel}
      scenarioLocked={scenarioLocked}
      scenarioLockedAt={scenarioLockedAt}
      title={titleLabel}
      templateKey={templateKeyLabel}
      inviteEnabled={inviteEnabled}
      inviteDisabledReason={inviteDisabledReason}
      canApprove={canApprove}
      approveLoading={approveLoading}
      onApprove={onApprove}
      regenerateLoading={regenerateLoading}
      onRegenerate={onRegenerate}
      onInvite={onInvite}
    />
  );
}
