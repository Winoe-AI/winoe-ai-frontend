import type { TrialPlanSectionProps } from './TrialPlanSection.types';

type DeriveTrialPlanSectionStateArgs = Pick<
  TrialPlanSectionProps,
  'planDays' | 'scenarioLabel' | 'rubricSummary'
>;

export function deriveTrialPlanSectionState({
  planDays,
  scenarioLabel,
  rubricSummary,
}: DeriveTrialPlanSectionStateArgs) {
  const hasTasks = planDays.some((slot) => Boolean(slot.task));
  const hasScenario = Boolean(scenarioLabel?.trim());
  const hasRubricSummary = Boolean(rubricSummary?.trim());

  return {
    isEmptyScenario: !hasTasks && !hasScenario && !hasRubricSummary,
  };
}
