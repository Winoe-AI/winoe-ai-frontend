import Button from '@/shared/ui/Button';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffFinalizeCard({ controller }: Props) {
  if (!controller.pendingFinalize) return null;

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <div className="text-sm font-semibold text-blue-900">
        Finalize Day 4 submission
      </div>
      <p className="mt-1 text-sm text-blue-900">
        Your demo video is uploaded. Finalize it to lock in the latest attempt
        for Day 4.
      </p>
      {controller.consentValidation ? (
        <p className="mt-2 text-sm text-red-700">
          {controller.consentValidation}
        </p>
      ) : !controller.consentChecked ? (
        <p className="mt-2 text-sm text-blue-900">
          Confirm the consent checkbox above to enable final submission.
        </p>
      ) : null}
      <div className="mt-3">
        <Button
          onClick={() => {
            void controller.onCompleteUpload();
          }}
          loading={controller.completingUpload}
          disabled={controller.finalizeDisabled}
        >
          Finalize demo
        </Button>
      </div>
    </div>
  );
}
