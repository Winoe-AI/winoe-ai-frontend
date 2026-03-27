import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffUploadProgress({ controller }: Props) {
  if (!controller.uploading) return null;

  return (
    <div
      className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
      role="status"
      aria-live="polite"
    >
      <div className="font-medium">Uploading video...</div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded bg-blue-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={controller.state.uploadProgressPct}
      >
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${String(controller.state.uploadProgressPct)}%` }}
        />
      </div>
      <div className="mt-1 text-xs">
        {String(controller.state.uploadProgressPct)}% uploaded
      </div>
    </div>
  );
}
