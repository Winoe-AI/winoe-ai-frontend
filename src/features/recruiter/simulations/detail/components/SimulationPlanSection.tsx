'use client';
import Button from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import { statusMeta } from '@/shared/status/statusMeta';
import { SimulationPlan } from '../utils/plan';
import { SimulationPlanContent } from './SimulationPlanContent';

type Props = {
  status: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
  templateKeyLabel: string;
  roleLabel: string;
  stackLabel: string;
  levelLabel: string;
  focusLabel: string;
  companyContextLabel: string;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  contentUnavailableMessage: string | null;
  planDays: {
    dayIndex: number;
    task: SimulationPlan['days'][number] | null;
    aiEvaluationEnabled: boolean;
  }[];
  loading: boolean;
  statusCode: number | null;
  generating: boolean;
  actionError: string | null;
  retryGenerateLoading: boolean;
  onRetryGenerate: () => void;
  jobFailureMessage: string | null;
  jobFailureCode: string | null;
  error: string | null;
  onRetry: () => void;
};

export function SimulationPlanSection({
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
}: Props) {
  const hasTasks = planDays.some((slot) => Boolean(slot.task));
  const hasScenario = Boolean(scenarioLabel?.trim());
  const hasRubricSummary = Boolean(rubricSummary?.trim());
  const isEmptyScenario = !hasTasks && !hasScenario && !hasRubricSummary;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <Header
        status={status}
        scenarioVersionLabel={scenarioVersionLabel}
        scenarioIdLabel={scenarioIdLabel}
        scenarioLocked={scenarioLocked}
      />
      {loading ? (
        <LoadingSkeleton />
      ) : statusCode === 404 ? (
        <NotFoundState />
      ) : statusCode === 403 ? (
        <ForbiddenState />
      ) : error ? (
        <Error onRetry={onRetry} message={error} />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {generating ? <GeneratingBanner /> : null}
          {actionError ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {actionError}
            </div>
          ) : null}
          {jobFailureMessage ? (
            <FailureBanner
              message={jobFailureMessage}
              code={jobFailureCode}
              loading={retryGenerateLoading}
              onRetryGenerate={onRetryGenerate}
            />
          ) : null}
          {contentUnavailableMessage ? (
            <ContentUnavailable message={contentUnavailableMessage} />
          ) : isEmptyScenario ? (
            <EmptyScenario
              loading={retryGenerateLoading}
              onRetryGenerate={onRetryGenerate}
            />
          ) : (
            <SimulationPlanContent
              templateKeyLabel={templateKeyLabel}
              roleLabel={roleLabel}
              stackLabel={stackLabel}
              levelLabel={levelLabel}
              focusLabel={focusLabel}
              companyContextLabel={companyContextLabel}
              scenarioLabel={scenarioLabel}
              rubricSummary={rubricSummary}
              planDays={planDays}
            />
          )}
        </div>
      )}
    </div>
  );
}

const Header = ({
  status,
  scenarioVersionLabel,
  scenarioIdLabel,
  scenarioLocked,
}: {
  status: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
}) => {
  const statusBadge = statusMeta(status ?? 'draft', 'Unknown');

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          5-day simulation plan
        </h2>
        <p className="text-sm text-gray-600">
          Review storyline, tasks, and rubric before inviting candidates.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <InlineBadge label={statusBadge.label} tone={statusBadge.tone} />
        <InlineBadge label={`Version ${scenarioVersionLabel}`} tone="info" />
        {scenarioIdLabel ? (
          <InlineBadge label={`Scenario ID ${scenarioIdLabel}`} tone="muted" />
        ) : null}
        <InlineBadge
          label={scenarioLocked ? 'Version locked' : 'Version unlocked'}
          tone={scenarioLocked ? 'warning' : 'muted'}
        />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="mt-4 space-y-4" aria-label="scenario-loading-skeleton">
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-2 h-3 w-4/6" />
    </div>
    <div className="grid gap-3">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="rounded border border-gray-200 bg-white p-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-11/12" />
        </div>
      ))}
    </div>
  </div>
);

const GeneratingBanner = () => (
  <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"
        aria-hidden="true"
      />
      Scenario generation is in progress. This view refreshes automatically.
    </div>
  </div>
);

const FailureBanner = ({
  message,
  code,
  loading,
  onRetryGenerate,
}: {
  message: string;
  code: string | null;
  loading: boolean;
  onRetryGenerate: () => void;
}) => (
  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
    <div className="font-medium">Scenario generation failed.</div>
    <p className="mt-1">{message}</p>
    {code ? <p className="mt-1 text-xs">Code: {code}</p> : null}
    <div className="mt-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetryGenerate}
        loading={loading}
      >
        Retry generate
      </Button>
    </div>
  </div>
);

const EmptyScenario = ({
  loading,
  onRetryGenerate,
}: {
  loading: boolean;
  onRetryGenerate: () => void;
}) => (
  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    <p className="font-medium text-gray-900">Scenario not generated yet.</p>
    <p className="mt-1 text-gray-600">
      Generate or retry scenario creation to preview storyline, tasks, and
      rubric.
    </p>
    <div className="mt-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetryGenerate}
        loading={loading}
      >
        Retry generate
      </Button>
    </div>
  </div>
);

const ContentUnavailable = ({ message }: { message: string }) => (
  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    <p className="font-medium text-gray-900">Scenario content unavailable.</p>
    <p className="mt-1 text-gray-600">{message}</p>
  </div>
);

const NotFoundState = () => (
  <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    Simulation not found.
  </div>
);

const ForbiddenState = () => (
  <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    You don&apos;t have access to this simulation.
  </div>
);

const Error = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
    {message}
    <div className="mt-2">
      <button className="text-blue-600 underline" onClick={onRetry}>
        Retry
      </button>
    </div>
  </div>
);
