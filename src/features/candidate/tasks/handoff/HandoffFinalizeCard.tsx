import Button from '@/shared/ui/Button';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffFinalizeCard({ controller }: Props) {
  if (!controller.pendingFinalize) return null;

  return (
    <div className="rounded-md border border-wheat-100 bg-wheat-50 p-4 text-wheat-900">
      <div className="text-sm font-semibold">Finalize Day 4 submission</div>
      <p className="mt-1 text-sm text-wheat-700">
        Your demo video is uploaded. Preview it, then finalize it to save the
        latest Handoff + Demo attempt for Day 4.
      </p>
      {controller.consentValidation ? (
        <p className="mt-2 text-sm text-red-700">
          {controller.consentValidation}
        </p>
      ) : !controller.consentChecked ? (
        <p className="mt-2 text-sm text-wheat-700">
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
          aria-label="Finalize demo: finalize Handoff + Demo"
        >
          Finalize Handoff + Demo
        </Button>
      </div>
    </div>
  );
}
