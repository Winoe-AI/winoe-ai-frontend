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
  | 'roleLabel'
  | 'preferredLanguageFrameworkLabel'
  | 'levelLabel'
  | 'focusLabel'
  | 'companyContextLabel'
  | 'notesLabel'
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
    notesLabel: props.notesLabel,
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
      {props.generating && !props.jobFailureMessage ? (
        <TrialPlanGeneratingBanner />
      ) : null}
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
      {!props.jobFailureMessage && props.contentUnavailableMessage ? (
        <TrialPlanContentUnavailable
          message={props.contentUnavailableMessage}
        />
      ) : !props.jobFailureMessage && sectionState.isEmptyScenario ? (
        <TrialPlanEmptyState
          loading={props.retryGenerateLoading}
          onRetryGenerate={props.onRetryGenerate}
        />
      ) : (
        <TrialPlanContent
          roleLabel={props.roleLabel}
          preferredLanguageFrameworkLabel={
            props.preferredLanguageFrameworkLabel
          }
          levelLabel={props.levelLabel}
          focusLabel={props.focusLabel}
          companyContextLabel={props.companyContextLabel}
          notesLabel={props.notesLabel}
          scenarioLabel={props.scenarioLabel}
          rubricSummary={props.rubricSummary}
          planDays={props.planDays}
        />
      )}
    </div>
  );
}
