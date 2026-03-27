'use client';
import Button from '@/shared/ui/Button';

export const SimulationPlanGeneratingBanner = () => (
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

export const SimulationPlanFailureBanner = ({
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

export const SimulationPlanEmptyState = ({
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

export const SimulationPlanContentUnavailable = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    <p className="font-medium text-gray-900">Scenario content unavailable.</p>
    <p className="mt-1 text-gray-600">{message}</p>
  </div>
);
