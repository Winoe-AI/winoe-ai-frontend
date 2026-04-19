import type { TrialPlanSectionProps } from './TrialPlanSection.types';

type DeriveTrialPlanSectionStateArgs = Pick<
  TrialPlanSectionProps,
  'planDays' | 'scenarioLabel' | 'rubricSummary' | 'notesLabel'
>;

export function deriveTrialPlanSectionState({
  planDays,
  scenarioLabel,
  rubricSummary,
  notesLabel,
}: DeriveTrialPlanSectionStateArgs) {
  const hasTasks = planDays.some((slot) => Boolean(slot.task));
  const hasScenario = Boolean(scenarioLabel?.trim());
  const hasRubricSummary = Boolean(rubricSummary?.trim());
  const hasNotes = Boolean(notesLabel?.trim());

  return {
    isEmptyScenario:
      !hasTasks && !hasScenario && !hasRubricSummary && !hasNotes,
  };
}
