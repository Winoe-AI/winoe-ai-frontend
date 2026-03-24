import { memo } from 'react';

type TaskPanelErrorBannerProps = {
  message: string | null;
};

export const TaskPanelErrorBanner = memo(function TaskPanelErrorBanner({
  message,
}: TaskPanelErrorBannerProps) {
  return (
    <div className="mt-2 min-h-[52px]">
      {message ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}
    </div>
  );
});
