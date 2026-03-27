import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffTranscriptProcessing({ controller }: Props) {
  if (!controller.showProcessing) return null;

  return (
    <div
      className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
      role="status"
      aria-live="polite"
    >
      Transcript processing...
      {controller.state.transcriptProgressPct !== null ? (
        <span className="ml-1">({String(controller.state.transcriptProgressPct)}%)</span>
      ) : null}
    </div>
  );
}
