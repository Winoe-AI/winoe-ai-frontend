import type { SimulationPlanSectionProps } from './SimulationPlanSection.types';

type DeriveSimulationPlanSectionStateArgs = Pick<
  SimulationPlanSectionProps,
  'planDays' | 'scenarioLabel' | 'rubricSummary'
>;

export function deriveSimulationPlanSectionState({
  planDays,
  scenarioLabel,
  rubricSummary,
}: DeriveSimulationPlanSectionStateArgs) {
  const hasTasks = planDays.some((slot) => Boolean(slot.task));
  const hasScenario = Boolean(scenarioLabel?.trim());
  const hasRubricSummary = Boolean(rubricSummary?.trim());

  return {
    isEmptyScenario: !hasTasks && !hasScenario && !hasRubricSummary,
  };
}
