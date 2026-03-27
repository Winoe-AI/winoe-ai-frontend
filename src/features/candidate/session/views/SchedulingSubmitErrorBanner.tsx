type SchedulingSubmitErrorBannerProps = {
  scheduleSubmitError: string | null;
  onScheduleRetry: () => void;
};

export function SchedulingSubmitErrorBanner({
  scheduleSubmitError,
  onScheduleRetry,
}: SchedulingSubmitErrorBannerProps) {
  if (!scheduleSubmitError) return null;

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {scheduleSubmitError}
      <button className="ml-2 underline" onClick={onScheduleRetry}>
        Retry
      </button>
    </div>
  );
}
