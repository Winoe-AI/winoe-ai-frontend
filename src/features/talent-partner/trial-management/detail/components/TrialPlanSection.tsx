'use client';
import { TrialPlanSectionBody } from './TrialPlanSectionBody';
import { TrialPlanSectionHeader } from './TrialPlanSectionHeader';
import type { TrialPlanSectionProps } from './TrialPlanSection.types';

export type { TrialPlanSectionProps };

export function TrialPlanSection({
  status,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
  templateKeyLabel,
  roleLabel,
  stackLabel,
  levelLabel,
  focusLabel,
  companyContextLabel,
  scenarioLabel,
  rubricSummary,
  contentUnavailableMessage,
  planDays,
  loading,
  statusCode,
  generating,
  actionError,
  retryGenerateLoading,
  onRetryGenerate,
  jobFailureMessage,
  jobFailureCode,
  error,
  onRetry,
}: TrialPlanSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <TrialPlanSectionHeader
        status={status}
        scenarioVersionLabel={scenarioVersionLabel}
        scenarioIdLabel={scenarioIdLabel}
        scenarioLocked={scenarioLocked}
      />
      <TrialPlanSectionBody
        templateKeyLabel={templateKeyLabel}
        roleLabel={roleLabel}
        stackLabel={stackLabel}
        levelLabel={levelLabel}
        focusLabel={focusLabel}
        companyContextLabel={companyContextLabel}
        scenarioLabel={scenarioLabel}
        rubricSummary={rubricSummary}
        contentUnavailableMessage={contentUnavailableMessage}
        planDays={planDays}
        loading={loading}
        statusCode={statusCode}
        generating={generating}
        actionError={actionError}
        retryGenerateLoading={retryGenerateLoading}
        onRetryGenerate={onRetryGenerate}
        jobFailureMessage={jobFailureMessage}
        jobFailureCode={jobFailureCode}
        error={error}
        onRetry={onRetry}
      />
    </div>
  );
}
