'use client';
import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import PageHeader from '@/shared/ui/PageHeader';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';
import { RegenerateScenarioButton } from '../scenario';

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

function lockLabel(locked: boolean, lockedAt: string | null): string {
  if (!locked) return 'Unlocked';
  if (!lockedAt) return 'Locked';
  const parsed = new Date(lockedAt);
  if (Number.isNaN(parsed.getTime())) return 'Locked';
  return `Locked ${parsed.toLocaleDateString()}`;
}

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
            title={
              inviteEnabled ? undefined : (inviteDisabledReason ?? undefined)
            }
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
            {simulationStatus === 'terminated'
              ? 'Simulation terminated'
              : 'Terminate simulation'}
          </Button>
          <Link
            className="text-sm text-blue-600 hover:underline"
            href="/dashboard"
          >
            ← Back to dashboard
          </Link>
        </div>
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
