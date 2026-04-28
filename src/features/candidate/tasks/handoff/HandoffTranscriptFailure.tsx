import { isTranscriptFailed } from './handoffUploadMachine';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffTranscriptFailure({ controller }: Props) {
  if (controller.state.isDeleted) return null;
  if (!isTranscriptFailed(controller.state.transcriptStatus)) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="font-semibold">Transcript status: failed</div>
      <p className="mt-1">
        Winoe AI received the demo video, but the transcript could not be
        processed. This may block Day 4 completion and Winoe Score evaluation
        until it is resolved.
      </p>
      {!controller.windowClosed ? (
        <p className="mt-1">
          Resubmit your Handoff + Demo before the cutoff to retry transcript
          processing.
        </p>
      ) : (
        <p className="mt-1">
          The Day 4 cutoff has passed, so resubmission is locked. Contact
          support rather than assuming this submission is complete.
        </p>
      )}
    </div>
  );
}
