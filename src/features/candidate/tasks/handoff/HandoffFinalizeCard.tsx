import Button from '@/shared/ui/Button';
import { CONSENT_HELPER_TEXT } from './panelConstants';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffFinalizeCard({ controller }: Props) {
  if (!controller.pendingFinalize) return null;

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <div className="text-sm font-semibold text-blue-900">Complete upload</div>
      <p className="mt-1 text-sm text-blue-900">
        Your video file is uploaded. Consent is required before finalizing Day 4
        submission.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-blue-900">
        <input
          className="mt-0.5"
          type="checkbox"
          checked={controller.consentChecked}
          onChange={(event) => {
            const next = event.target.checked;
            controller.setConsentChecked(next);
            controller.setConsentValidation(null);
          }}
        />
        <span>
          I understand and consent to submission and processing of my video and
          transcript for evaluation.
        </span>
      </label>
      {controller.consentValidation ? (
        <p className="mt-2 text-sm text-red-700">
          {controller.consentValidation}
        </p>
      ) : !controller.consentChecked ? (
        <p className="mt-2 text-sm text-blue-900">{CONSENT_HELPER_TEXT}</p>
      ) : null}
      <div className="mt-3">
        <Button
          onClick={() => {
            void controller.onCompleteUpload();
          }}
          loading={controller.completingUpload}
          disabled={controller.finalizeDisabled}
        >
          Complete upload
        </Button>
      </div>
    </div>
  );
}
