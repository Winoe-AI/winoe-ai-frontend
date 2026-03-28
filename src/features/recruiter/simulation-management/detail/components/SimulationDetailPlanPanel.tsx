import { SimulationPlanSection } from './SimulationPlanSection';
import type { SimulationDetailViewProps } from './types';

type SimulationDetailPlanPanelProps = {
  props: SimulationDetailViewProps;
};

export function SimulationDetailPlanPanel({
  props,
}: SimulationDetailPlanPanelProps) {
  return (
    <SimulationPlanSection
      status={props.selectedScenarioStatusForDisplay}
      scenarioVersionLabel={props.scenarioVersionLabel}
      scenarioIdLabel={props.scenarioIdLabel}
      scenarioLocked={props.scenarioLocked}
      templateKeyLabel={props.templateKeyLabel}
      roleLabel={props.roleLabel}
      stackLabel={props.stackLabel}
      levelLabel={props.levelLabel}
      focusLabel={props.focusLabel}
      companyContextLabel={props.companyContextLabel}
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
