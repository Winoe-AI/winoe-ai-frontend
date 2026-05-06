import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffUploadProgress({ controller }: Props) {
  if (!controller.uploading && !controller.validating) return null;

  if (controller.validating) {
    return (
      <div
        className="rounded-md border border-wheat-100 bg-wheat-50 p-3 text-sm text-wheat-900"
        role="status"
        aria-live="polite"
      >
        <div className="font-medium">Checking video metadata...</div>
        <div className="mt-1 text-xs">
          Upload starts after this browser confirms the demo video is 15 minutes
          or shorter.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-wheat-100 bg-wheat-50 p-3 text-sm text-wheat-900"
      role="status"
      aria-live="polite"
    >
      <div className="font-medium">Uploading video...</div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded bg-wheat-500"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={controller.state.uploadProgressPct}
      >
        <div
          className="h-full bg-wheat-500 transition-all"
          style={{ width: `${String(controller.state.uploadProgressPct)}%` }}
        />
      </div>
      <div className="mt-1 text-xs">
        {String(controller.state.uploadProgressPct)}% uploaded
      </div>
    </div>
  );
}
