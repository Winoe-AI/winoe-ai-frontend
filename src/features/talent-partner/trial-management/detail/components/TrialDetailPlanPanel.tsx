import { TrialPlanSection } from './TrialPlanSection';
import type { TrialDetailViewProps } from './types';

type TrialDetailPlanPanelProps = {
  props: TrialDetailViewProps;
};

export function TrialDetailPlanPanel({ props }: TrialDetailPlanPanelProps) {
  return (
    <TrialPlanSection
      status={props.selectedScenarioStatusForDisplay}
      scenarioVersionLabel={props.scenarioVersionLabel}
      scenarioIdLabel={props.scenarioIdLabel}
      scenarioLocked={props.scenarioLocked}
      roleLabel={props.roleLabel}
      preferredLanguageFrameworkLabel={props.preferredLanguageFrameworkLabel}
      levelLabel={props.levelLabel}
      focusLabel={props.focusLabel}
      companyContextLabel={props.companyContextLabel}
      notesLabel={props.notesLabel}
      scenarioLabel={props.scenarioLabel}
      rubricSummary={props.rubricSummary}
      contentUnavailableMessage={props.scenarioContentUnavailableMessageForPlan}
      planDays={props.planDays}
      loading={props.planLoading}
      statusCode={props.planStatusCode}
      generating={props.generating}
      actionError={props.actionError}
      retryGenerateLoading={props.retryGenerateLoading}
      onRetryGenerate={props.onRetryGenerate}
      jobFailureMessage={props.jobFailureMessage}
      jobFailureCode={props.jobFailureCode}
      error={props.planError}
      onRetry={props.reloadPlan}
    />
  );
}
