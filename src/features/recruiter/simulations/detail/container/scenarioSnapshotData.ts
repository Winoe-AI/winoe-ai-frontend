import type { ScenarioSnapshotFromDetailArgs, ScenarioVersionSnapshot, PlanDaySlot } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function taskPromptsFromPlanDays(
  planDays: PlanDaySlot[],
): Array<Record<string, unknown>> | null {
  const prompts = planDays
    .filter((slot) => slot.task)
    .map((slot) => ({
      dayIndex: slot.dayIndex,
      title: slot.task?.title ?? `Day ${slot.dayIndex}`,
      description: slot.task?.prompt ?? '',
      type: slot.task?.type ?? undefined,
    }));
  return prompts.length ? prompts : null;
}

function normalizeTaskPrompts(value: unknown): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;
  const normalized = value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({ ...entry }));
  return normalized.length ? normalized : [];
}

function normalizeRubricObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return { ...(value as Record<string, unknown>) };
}

export function toScenarioSnapshotFromDetail({
  detail,
  fallbackTaskPrompts,
}: ScenarioSnapshotFromDetailArgs): ScenarioVersionSnapshot | null {
  const activeId =
    detail.activeScenarioVersionId ?? detail.scenarioVersion.id ?? detail.pendingScenarioVersionId;
  if (!activeId) return null;
  return {
    id: activeId,
    versionIndex: detail.scenarioVersion.versionIndex,
    status: detail.scenarioVersion.status,
    lockedAt: detail.scenarioVersion.lockedAt,
    contentAvailability: detail.scenarioVersion.contentAvailability,
    storylineMd: detail.storyline,
    taskPrompts: normalizeTaskPrompts(detail.taskPromptsJson) ?? fallbackTaskPrompts,
    rubric: normalizeRubricObject(detail.rubricJson),
  };
}
