'use client';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import PageHeader from '@/shared/ui/PageHeader';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';
import { TrialDetailHeaderActions } from './TrialDetailHeaderActions';
import { lockLabel } from './trialDetailHeaderLockLabel';
type Props = {
  trialId: string;
  trialStatus: string | null;
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

export function TrialDetailHeaderCore({
  trialId,
  trialStatus,
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
    selectedScenarioStatusForDisplay ?? trialStatus ?? 'draft',
    'Unknown',
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={title}
          subtitle={`Trial ID: ${trialId} · Template: ${templateKey}`}
        />
        <TrialDetailHeaderActions
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
          trialStatus={trialStatus}
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
