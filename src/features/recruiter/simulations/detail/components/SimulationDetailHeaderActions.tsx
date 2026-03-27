'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { RegenerateScenarioButton } from '../scenario';

type Props = {
  canApprove: boolean;
  approveButtonLabel: string;
  approveLoading: boolean;
  onApprove: () => void;
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  scenarioVersionLabel: string;
  onRegenerate: () => void;
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  onInvite: () => void;
  simulationStatus: string | null;
  terminatePending: boolean;
  onOpenTerminateModal: () => void;
};

export function SimulationDetailHeaderActions({
  canApprove,
  approveButtonLabel,
  approveLoading,
  onApprove,
  regenerateLoading,
  regenerateDisabled,
  scenarioVersionLabel,
  onRegenerate,
  inviteEnabled,
  inviteDisabledReason,
  onInvite,
  simulationStatus,
  terminatePending,
  onOpenTerminateModal,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canApprove ? (
        <Button onClick={onApprove} size="sm" loading={approveLoading} disabled={!canApprove}>
          {approveButtonLabel}
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
      >
        Invite candidate
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500"
        onClick={onOpenTerminateModal}
        disabled={simulationStatus === 'terminated' || terminatePending}
        loading={terminatePending}
      >
        {simulationStatus === 'terminated' ? 'Simulation terminated' : 'Terminate simulation'}
      </Button>
      <Link className="text-sm text-blue-600 hover:underline" href="/dashboard">
        ← Back to dashboard
      </Link>
    </div>
  );
}
