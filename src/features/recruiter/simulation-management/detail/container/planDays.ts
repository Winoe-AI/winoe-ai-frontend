import { normalizeSimulationPlanDay } from '../utils/plan';
import type { PlanDaySlot } from './types';

export function buildPlanDaysForVersion(
  basePlanDays: PlanDaySlot[],
  taskPrompts: Array<Record<string, unknown>> | null,
): PlanDaySlot[] {
  if (!taskPrompts?.length) return basePlanDays;
  const normalizedDays = taskPrompts
    .map((entry, index) => normalizeSimulationPlanDay(entry, index + 1))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (!normalizedDays.length) return basePlanDays;
  const selectedByDay = new Map(
    normalizedDays.map((day) => [day.dayIndex, day]),
  );
  return [1, 2, 3, 4, 5].map((dayIndex) => {
    const selected = selectedByDay.get(dayIndex);
    const baseSlot = basePlanDays.find((slot) => slot.dayIndex === dayIndex);
    const base = baseSlot?.task ?? null;
    const aiEvaluationEnabled = baseSlot?.aiEvaluationEnabled ?? true;
    if (!selected) return { dayIndex, task: base, aiEvaluationEnabled };
    if (!base) return { dayIndex, task: selected, aiEvaluationEnabled };
    return {
      dayIndex,
      aiEvaluationEnabled,
      task: {
        ...base,
        title: selected.title,
        type: selected.type,
        prompt: selected.prompt,
      },
    };
  });
}
