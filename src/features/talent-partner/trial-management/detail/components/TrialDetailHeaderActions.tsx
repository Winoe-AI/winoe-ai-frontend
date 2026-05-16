'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { RegenerateScenarioButton } from '../scenario';
import { TrialDetailOverflowMenu } from './TrialDetailOverflowMenu';

type Props = {
  commandCenterActive: boolean;
  onRevealScenarioWorkbench: () => void;
  canApprove: boolean;
  approveButtonLabel: string;
  approveLoading: boolean;
  onApprove: () => void;
  canActivate: boolean;
  activateButtonLabel: string;
  activateLoading: boolean;
  onActivate: () => void;
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  scenarioVersionLabel: string;
  onRegenerate: () => void;
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  onInvite: () => void;
  trialStatus: string | null;
  terminatePending: boolean;
  onOpenTerminateModal: () => void;
};

export function TrialDetailHeaderActions({
  commandCenterActive,
  onRevealScenarioWorkbench,
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
  scenarioVersionLabel,
  onRegenerate,
  inviteEnabled,
  inviteDisabledReason,
  onInvite,
  trialStatus,
  terminatePending,
  onOpenTerminateModal,
}: Props) {
  if (commandCenterActive) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          onClick={onInvite}
          size="sm"
          disabled={!inviteEnabled}
          title={
            inviteEnabled ? undefined : (inviteDisabledReason ?? undefined)
          }
          data-testid="invite-candidates-header"
        >
          Invite candidates
        </Button>
        <TrialDetailOverflowMenu
          onEditDetails={onRevealScenarioWorkbench}
          onTerminate={onOpenTerminateModal}
          terminatePending={terminatePending}
          trialTerminated={trialStatus === 'terminated'}
          midMenuSlot={
            <RegenerateScenarioButton
              appearance="menu"
              loading={regenerateLoading}
              disabled={regenerateDisabled}
              currentVersionLabel={scenarioVersionLabel}
              onConfirm={onRegenerate}
            />
          }
        />
        <Link
          className="tp-no-print text-sm text-wheat-700 hover:text-wheat-900 hover:underline"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canApprove ? (
        <Button
          onClick={onApprove}
          size="sm"
          loading={approveLoading}
          disabled={!canApprove}
        >
          {approveButtonLabel}
        </Button>
      ) : null}
      {canActivate ? (
        <Button
          onClick={onActivate}
          size="sm"
          loading={activateLoading}
          disabled={!canActivate}
        >
          {activateButtonLabel}
        </Button>
      ) : null}
      <RegenerateScenarioButton
        loading={regenerateLoading}
        disabled={regenerateDisabled}
        currentVersionLabel={scenarioVersionLabel}
        onConfirm={onRegenerate}
      />
      <Button
        onClick={onInvite}
        size="sm"
        disabled={!inviteEnabled}
        title={inviteEnabled ? undefined : (inviteDisabledReason ?? undefined)}
        data-testid="invite-candidates-header"
      >
        Invite candidates
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500"
        onClick={onOpenTerminateModal}
        disabled={trialStatus === 'terminated' || terminatePending}
        loading={terminatePending}
      >
        {trialStatus === 'terminated' ? 'Trial terminated' : 'Terminate trial'}
      </Button>
      <Link
        className="tp-no-print text-sm text-wheat-700 hover:text-wheat-900 hover:underline"
        href="/dashboard"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
