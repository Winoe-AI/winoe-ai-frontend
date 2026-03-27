import { formatSegmentRange } from './panelUtils';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = { controller: HandoffUploadPanelController };

export function HandoffTranscriptPanel({ controller }: Props) {
  if (!controller.showTranscript) return null;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">Transcript</div>
      <div className="mt-3 max-h-72 space-y-4 overflow-auto rounded border border-gray-100 bg-gray-50 p-3">
        {controller.hasTranscriptText ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Full transcript
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
              {controller.state.transcriptText}
            </p>
          </div>
        ) : null}

        {controller.hasTranscriptSegments ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Timestamped segments
            </div>
            <ul className="mt-2 space-y-2">
              {controller.transcriptSegments.map((segment, index) => (
                <li
                  key={`${segment.id ?? 'segment'}-${String(segment.startMs)}-${String(index)}`}
                  className="rounded border border-gray-200 bg-white p-2"
                >
                  <div className="text-xs font-medium text-gray-500">
                    {formatSegmentRange(segment)}
                  </div>
                  <div className="mt-1 text-sm text-gray-800">{segment.text}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!controller.hasTranscriptText && !controller.hasTranscriptSegments ? (
          <div className="text-sm text-gray-600">
            Transcript is marked ready, but text and timestamped segments are not
            available yet. Refresh and retry shortly.
          </div>
        ) : null}
      </div>
    </div>
  );
}
