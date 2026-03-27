'use client';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import PageHeader from '@/shared/ui/PageHeader';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';
import { SimulationDetailHeaderActions } from './SimulationDetailHeaderActions';
import { lockLabel } from './simulationDetailHeaderLockLabel';
type Props = {
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioStatusForDisplay: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
  scenarioLockedAt: string | null;
  title: string;
  templateKey: string;
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  canApprove: boolean;
  approveButtonLabel: string;
  approveLoading: boolean;
  onApprove: () => void;
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  onRegenerate: () => void;
  terminatePending: boolean;
  onOpenTerminateModal: () => void;
  onInvite: () => void;
};

export function SimulationDetailHeaderCore({
  simulationId,
  simulationStatus,
  selectedScenarioStatusForDisplay,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
  scenarioLockedAt,
  title,
  templateKey,
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
  const status = statusMeta(
    selectedScenarioStatusForDisplay ?? simulationStatus ?? 'draft',
    'Unknown',
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={title}
          subtitle={`Simulation ID: ${simulationId} · Template: ${templateKey}`}
        />
        <SimulationDetailHeaderActions
          canApprove={canApprove}
          approveButtonLabel={approveButtonLabel}
          approveLoading={approveLoading}
          onApprove={onApprove}
          regenerateLoading={regenerateLoading}
          regenerateDisabled={regenerateDisabled}
          scenarioVersionLabel={scenarioVersionLabel}
          onRegenerate={onRegenerate}
          inviteEnabled={inviteEnabled}
          inviteDisabledReason={inviteDisabledReason}
          onInvite={onInvite}
          simulationStatus={simulationStatus}
          terminatePending={terminatePending}
          onOpenTerminateModal={onOpenTerminateModal}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={status.label} tone={status.tone} />
        <InlineBadge label={`Scenario ${scenarioVersionLabel}`} tone="info" />
        {scenarioIdLabel ? (
          <InlineBadge label={`ID: ${scenarioIdLabel}`} tone="muted" />
        ) : null}
        <InlineBadge
          label={lockLabel(scenarioLocked, scenarioLockedAt)}
          tone={scenarioLocked ? 'warning' : 'muted'}
        />
      </div>
      {!inviteEnabled && inviteDisabledReason ? (
        <p className="text-xs text-gray-600">{inviteDisabledReason}</p>
      ) : null}
    </div>
  );
}
