import { StatusPill } from '@/shared/ui/StatusPill';
import { HandoffUploadActionButtons } from './HandoffUploadActionButtons';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = {
  controller: HandoffUploadPanelController;
  candidateSessionId: number | null;
};

export function HandoffUploadCard({ controller, candidateSessionId }: Props) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-gray-900">Video upload</div>
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

      {controller.state.isDeleted ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
          Upload deleted. Playback and transcript are unavailable.
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
