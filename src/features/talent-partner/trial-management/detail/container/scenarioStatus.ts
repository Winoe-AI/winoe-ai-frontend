import type { ScenarioVersionItem } from '../scenario';
import type {
  ScenarioUiStatusArgs,
  SelectedScenarioDisplayStatusArgs,
} from './types';

export function deriveScenarioUiStatus(
  args: ScenarioUiStatusArgs,
): ScenarioVersionItem['uiStatus'] {
  const normalizedStatus = args.snapshot.status?.toLowerCase() ?? null;
  const locked =
    Boolean(args.snapshot.lockedAt) || normalizedStatus === 'locked';
  if (locked) return 'locked';
  const isPending =
    args.pendingScenarioVersionId != null &&
    args.snapshot.id === args.pendingScenarioVersionId;
  const isActive =
    args.activeScenarioVersionId != null &&
    args.snapshot.id === args.activeScenarioVersionId;
  if (
    isPending &&
    (args.regeneratingScenarioVersionId === args.snapshot.id ||
      normalizedStatus === 'generating' ||
      normalizedStatus === 'draft')
  ) {
    return 'generating';
  }
  if (isActive && args.globalGenerating) return 'generating';
  if (normalizedStatus === 'generating' || normalizedStatus === 'draft')
    return 'generating';
  if (normalizedStatus === 'approved') return 'approved';
  if (isActive && args.trialStatus === 'active_inviting') return 'approved';
  return 'ready_for_review';
}

export function deriveSelectedScenarioDisplayStatus(
  args: SelectedScenarioDisplayStatusArgs,
): string | null {
  const selected = args.selectedScenarioVersion;
  if (!selected) return args.trialStatus;
  if (selected.uiStatus === 'generating') return 'generating';
  if (selected.uiStatus === 'locked') return 'locked';
  if (selected.contentAvailability === 'local_only') return 'local_only';
  if (selected.contentAvailability === 'unavailable') return 'unavailable';
  if (selected.uiStatus === 'approved')
    return args.trialStatus === 'active_inviting'
      ? 'active_inviting'
      : 'approved';
  return selected.uiStatus;
}
