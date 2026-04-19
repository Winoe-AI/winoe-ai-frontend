'use client';

import { TrialDetailHeaderCore } from './TrialDetailHeaderCore';
import type { TrialDetailViewProps } from './types';

type Props = Pick<
  TrialDetailViewProps,
  | 'trialId'
  | 'trialStatus'
  | 'selectedScenarioStatusForDisplay'
  | 'scenarioVersionLabel'
  | 'scenarioIdLabel'
  | 'scenarioLocked'
  | 'scenarioLockedAt'
  | 'titleLabel'
  | 'inviteEnabled'
  | 'inviteDisabledReason'
  | 'canApprove'
  | 'approveButtonLabel'
  | 'approveLoading'
  | 'onApprove'
  | 'canActivate'
  | 'activateButtonLabel'
  | 'activateLoading'
  | 'onActivate'
  | 'regenerateLoading'
  | 'regenerateDisabled'
  | 'onRegenerate'
  | 'terminatePending'
> & { onInvite: () => void; onOpenTerminateModal: () => void };

export function TrialDetailHeader({
  trialId,
  trialStatus,
  selectedScenarioStatusForDisplay,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
  scenarioLockedAt,
  titleLabel,
  inviteEnabled,
  inviteDisabledReason,
  canApprove,
  approveButtonLabel,
  approveLoading,
  onApprove,
  canActivate,
  activateButtonLabel,
  activateLoading,
  onActivate,
  regenerateLoading,
  regenerateDisabled,
  onRegenerate,
  terminatePending,
  onOpenTerminateModal,
  onInvite,
}: Props) {
  return (
    <TrialDetailHeaderCore
      trialId={trialId}
      trialStatus={trialStatus}
      selectedScenarioStatusForDisplay={selectedScenarioStatusForDisplay}
      scenarioVersionLabel={scenarioVersionLabel}
      scenarioIdLabel={scenarioIdLabel}
      scenarioLocked={scenarioLocked}
      scenarioLockedAt={scenarioLockedAt}
      title={titleLabel}
      inviteEnabled={inviteEnabled}
      inviteDisabledReason={inviteDisabledReason}
      canApprove={canApprove}
      approveButtonLabel={approveButtonLabel}
      approveLoading={approveLoading}
      onApprove={onApprove}
      canActivate={canActivate}
      activateButtonLabel={activateButtonLabel}
      activateLoading={activateLoading}
      onActivate={onActivate}
      regenerateLoading={regenerateLoading}
      regenerateDisabled={regenerateDisabled}
      onRegenerate={onRegenerate}
      terminatePending={terminatePending}
      onOpenTerminateModal={onOpenTerminateModal}
      onInvite={onInvite}
    />
  );
}
