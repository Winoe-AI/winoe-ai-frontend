'use client';
import { TrialPlanContent } from './TrialPlanContent';
import {
  TrialPlanContentUnavailable,
  TrialPlanEmptyState,
  TrialPlanFailureBanner,
  TrialPlanGeneratingBanner,
} from './TrialPlanSectionBanners';
import {
  TrialPlanErrorState,
  TrialPlanForbiddenState,
  TrialPlanLoadingSkeleton,
  TrialPlanNotFoundState,
} from './TrialPlanSectionStates';
import type { TrialPlanSectionProps } from './TrialPlanSection.types';
import { deriveTrialPlanSectionState } from './trialPlanSectionState';

type TrialPlanSectionBodyProps = Pick<
  TrialPlanSectionProps,
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

export function TrialPlanSectionBody(props: TrialPlanSectionBodyProps) {
  const sectionState = deriveTrialPlanSectionState({
    planDays: props.planDays,
    scenarioLabel: props.scenarioLabel,
    rubricSummary: props.rubricSummary,
  });
  if (props.loading) return <TrialPlanLoadingSkeleton />;
  if (props.statusCode === 404) return <TrialPlanNotFoundState />;
  if (props.statusCode === 403) return <TrialPlanForbiddenState />;
  if (props.error) {
    return (
      <TrialPlanErrorState onRetry={props.onRetry} message={props.error} />
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {props.generating ? <TrialPlanGeneratingBanner /> : null}
      {props.actionError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {props.actionError}
        </div>
      ) : null}
      {props.jobFailureMessage ? (
        <TrialPlanFailureBanner
          message={props.jobFailureMessage}
          code={props.jobFailureCode}
          loading={props.retryGenerateLoading}
          onRetryGenerate={props.onRetryGenerate}
        />
      ) : null}
      {props.contentUnavailableMessage ? (
        <TrialPlanContentUnavailable
          message={props.contentUnavailableMessage}
        />
      ) : sectionState.isEmptyScenario ? (
        <TrialPlanEmptyState
          loading={props.retryGenerateLoading}
          onRetryGenerate={props.onRetryGenerate}
        />
      ) : (
        <TrialPlanContent
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
