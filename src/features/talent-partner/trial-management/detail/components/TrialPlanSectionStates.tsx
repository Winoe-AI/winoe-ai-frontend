'use client';
import { Skeleton } from '@/shared/ui/Skeleton';

export const TrialPlanLoadingSkeleton = () => (
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

export const TrialPlanNotFoundState = () => (
  <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    Trial not found.
  </div>
);

export const TrialPlanForbiddenState = () => (
  <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
    You don&apos;t have access to this trial.
  </div>
);

export const TrialPlanErrorState = ({
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
