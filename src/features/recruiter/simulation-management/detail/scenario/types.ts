import type { ScenarioContentAvailability } from '../utils/detailUtils';

export type ScenarioUiStatus =
  | 'generating'
  | 'ready_for_review'
  | 'approved'
  | 'locked';

export type ScenarioVersionItem = {
  id: string;
  versionIndex: number | null;
  status: string | null;
  uiStatus: ScenarioUiStatus;
  lockedAt: string | null;
  isLocked: boolean;
  isActive: boolean;
  isPending: boolean;
  contentAvailability: ScenarioContentAvailability;
  storylineMd: string | null;
  taskPrompts: Array<Record<string, unknown>> | null;
  rubric: Record<string, unknown> | null;
};
