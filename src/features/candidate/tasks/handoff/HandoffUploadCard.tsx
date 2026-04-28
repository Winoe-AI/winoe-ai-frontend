import { StatusPill } from '@/shared/ui/StatusPill';
import { CONSENT_HELPER_TEXT } from './panelConstants';
import { HandoffUploadActionButtons } from './HandoffUploadActionButtons';
import { formatBytes, formatDuration } from './panelUtils';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = {
  controller: HandoffUploadPanelController;
  candidateSessionId: number | null;
};

export function HandoffUploadCard({ controller, candidateSessionId }: Props) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-gray-900">
          Handoff + Demo video
        </div>
        {controller.validating ? (
          <StatusPill label="Checking video" tone="info" />
        ) : null}
        {controller.showProcessing ? (
          <StatusPill label="Transcript processing..." tone="info" />
        ) : null}
        {controller.showTranscript ? (
          <StatusPill label="Transcript ready" tone="success" />
        ) : null}
        {controller.state.isDeleted ? (
          <StatusPill label="Deleted" tone="muted" />
        ) : null}
      </div>
      <p className="mt-1 text-xs text-gray-600">{controller.uploadHint}</p>
      <p className="mt-2 text-xs text-gray-700">
        You can resubmit until the Day 4 cutoff. The latest valid Handoff + Demo
        submitted before cutoff is the one used in the Evidence Trail.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-gray-800">
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
          I consent to submission and processing of my demo video and transcript
          for evaluation.
        </span>
      </label>
      {controller.consentValidation ? (
        <p className="mt-2 text-sm text-red-700">
          {controller.consentValidation}
        </p>
      ) : !controller.consentChecked ? (
        <p className="mt-2 text-sm text-gray-600">
          {CONSENT_HELPER_TEXT} Upload is disabled until consent is confirmed.
        </p>
      ) : null}

      {controller.state.isDeleted ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
          Upload deleted. Playback and transcript are unavailable.
        </div>
      ) : null}

      {controller.state.selectedFileName ? (
        <div className="mt-3 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
          <div className="font-medium text-gray-900">Selected demo video</div>
          <div className="mt-1">
            {controller.state.selectedFileName}
            {controller.state.selectedFileSizeBytes !== null
              ? ` (${formatBytes(controller.state.selectedFileSizeBytes)})`
              : ''}
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Duration:{' '}
            {controller.validating
              ? 'checking metadata...'
              : formatDuration(controller.state.selectedVideoDurationSeconds)}
          </div>
        </div>
      ) : null}

      <HandoffUploadActionButtons
        controller={controller}
        candidateSessionId={candidateSessionId}
      />

      {controller.hasRecording &&
      !controller.hasPreview &&
      !controller.state.isDeleted ? (
        <p className="mt-3 text-xs text-gray-600">
          {controller.recordingUnavailable
            ? 'Playback is unavailable for this upload right now. If this continues, contact support or refresh status later.'
            : 'Upload saved. Preview is temporarily unavailable right now. Refresh status and try again shortly.'}
        </p>
      ) : null}
    </div>
  );
}
