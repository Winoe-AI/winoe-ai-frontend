import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffPreviewCard({ controller }: Props) {
  if (!controller.hasPreview) return null;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">
        Preview your demo video
      </div>
      <video
        className="mt-3 max-h-96 w-full rounded bg-black"
        controls
        src={controller.state.previewUrl ?? undefined}
      />
    </div>
  );
}
