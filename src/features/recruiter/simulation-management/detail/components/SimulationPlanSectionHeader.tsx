'use client';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import { statusMeta } from '@/shared/status/statusMeta';

type SimulationPlanSectionHeaderProps = {
  status: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
};

export function SimulationPlanSectionHeader({
  status,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
}: SimulationPlanSectionHeaderProps) {
  const statusBadge = statusMeta(status ?? 'draft', 'Unknown');

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          5-day simulation plan
        </h2>
        <p className="text-sm text-gray-600">
          Review storyline, tasks, and rubric before inviting candidates.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <InlineBadge label={statusBadge.label} tone={statusBadge.tone} />
        <InlineBadge label={`Version ${scenarioVersionLabel}`} tone="info" />
        {scenarioIdLabel ? (
          <InlineBadge label={`Scenario ID ${scenarioIdLabel}`} tone="muted" />
        ) : null}
        <InlineBadge
          label={scenarioLocked ? 'Version locked' : 'Version unlocked'}
          tone={scenarioLocked ? 'warning' : 'muted'}
        />
      </div>
    </div>
  );
}
