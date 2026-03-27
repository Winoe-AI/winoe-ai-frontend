'use client';
import { SimulationPlanContent } from './SimulationPlanContent';
import {
  SimulationPlanContentUnavailable,
  SimulationPlanEmptyState,
  SimulationPlanFailureBanner,
  SimulationPlanGeneratingBanner,
} from './SimulationPlanSectionBanners';
import {
  SimulationPlanErrorState,
  SimulationPlanForbiddenState,
  SimulationPlanLoadingSkeleton,
  SimulationPlanNotFoundState,
} from './SimulationPlanSectionStates';
import type { SimulationPlanSectionProps } from './SimulationPlanSection.types';
import { deriveSimulationPlanSectionState } from './simulationPlanSectionState';

type SimulationPlanSectionBodyProps = Pick<
  SimulationPlanSectionProps,
  | 'templateKeyLabel'
  | 'roleLabel'
  | 'stackLabel'
  | 'levelLabel'
  | 'focusLabel'
  | 'companyContextLabel'
  | 'scenarioLabel'
  | 'rubricSummary'
  | 'contentUnavailableMessage'
  | 'planDays'
  | 'loading'
  | 'statusCode'
  | 'generating'
  | 'actionError'
  | 'retryGenerateLoading'
  | 'onRetryGenerate'
  | 'jobFailureMessage'
  | 'jobFailureCode'
  | 'error'
  | 'onRetry'
>;

export function SimulationPlanSectionBody(
  props: SimulationPlanSectionBodyProps,
) {
  const sectionState = deriveSimulationPlanSectionState({
    planDays: props.planDays,
    scenarioLabel: props.scenarioLabel,
    rubricSummary: props.rubricSummary,
  });
  if (props.loading) return <SimulationPlanLoadingSkeleton />;
  if (props.statusCode === 404) return <SimulationPlanNotFoundState />;
  if (props.statusCode === 403) return <SimulationPlanForbiddenState />;
  if (props.error) {
    return (
      <SimulationPlanErrorState onRetry={props.onRetry} message={props.error} />
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {props.generating ? <SimulationPlanGeneratingBanner /> : null}
      {props.actionError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {props.actionError}
        </div>
      ) : null}
      {props.jobFailureMessage ? (
        <SimulationPlanFailureBanner
          message={props.jobFailureMessage}
          code={props.jobFailureCode}
          loading={props.retryGenerateLoading}
          onRetryGenerate={props.onRetryGenerate}
        />
      ) : null}
      {props.contentUnavailableMessage ? (
        <SimulationPlanContentUnavailable
          message={props.contentUnavailableMessage}
        />
      ) : sectionState.isEmptyScenario ? (
        <SimulationPlanEmptyState
          loading={props.retryGenerateLoading}
          onRetryGenerate={props.onRetryGenerate}
        />
      ) : (
        <SimulationPlanContent
          templateKeyLabel={props.templateKeyLabel}
          roleLabel={props.roleLabel}
          stackLabel={props.stackLabel}
          levelLabel={props.levelLabel}
          focusLabel={props.focusLabel}
          companyContextLabel={props.companyContextLabel}
          scenarioLabel={props.scenarioLabel}
          rubricSummary={props.rubricSummary}
          planDays={props.planDays}
        />
      )}
    </div>
  );
}
