import Button from '@/shared/ui/Button';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffDeleteCard({ controller }: Props) {
  if (!controller.canDeleteAction) return null;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          onClick={controller.onOpenDeleteConfirm}
          disabled={controller.deleteDisabled}
        >
          Delete upload
        </Button>
        {controller.deleteDisabledReason ? (
          <span className="text-xs text-gray-600">
            {controller.deleteDisabledReason}
          </span>
        ) : null}
      </div>

      {controller.deleteConfirmOpen ? (
        <div
          className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Delete upload confirmation"
        >
          <div className="text-sm font-semibold text-amber-900">
            Delete this upload?
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            <li>Playback will be revoked.</li>
            <li>Transcript content will be deleted or made unavailable.</li>
            <li>This action is irreversible for MVP.</li>
          </ul>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => controller.setDeleteConfirmOpen(false)}
              disabled={controller.deletingUpload}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void controller.onConfirmDelete();
              }}
              loading={controller.deletingUpload}
              disabled={controller.deletingUpload}
            >
              Delete upload
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
