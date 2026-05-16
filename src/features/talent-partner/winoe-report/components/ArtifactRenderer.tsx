import type { RefObject } from 'react';
import { MarkdownPreview } from '@/shared/ui/Markdown';
import type { WinoeArtifactViewModel } from '../winoeReport.viewModel';

type Props = {
  artifact: WinoeArtifactViewModel;
  videoRef?: RefObject<HTMLVideoElement | null>;
};

function renderUnavailable(note: string) {
  return (
    <div className="space-y-1 text-sm text-secondary">
      {note.split('\n').map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export function ArtifactRenderer({ artifact, videoRef }: Props) {
  if (artifact.kind === 'video') {
    return (
      <div className="space-y-4">
        {artifact.videoUrl ? (
          <video
            ref={videoRef}
            controls
            src={artifact.videoUrl}
            className="w-full rounded-2xl border border-subtle bg-black"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-subtle bg-secondary p-4 text-sm text-secondary">
            No video source is available yet.
          </div>
        )}
        {artifact.transcript ? (
          <div className="rounded-2xl border border-subtle bg-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Transcript
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-primary">
              {artifact.transcript}
            </p>
          </div>
        ) : null}
        {artifact.unavailableNote
          ? renderUnavailable(artifact.unavailableNote)
          : null}
      </div>
    );
  }

  if (artifact.kind === 'code') {
    return (
      <div className="space-y-4">
        <pre className="overflow-x-auto rounded-2xl border border-subtle bg-secondary p-4 font-mono text-[13px] leading-6 text-primary">
          {artifact.body}
        </pre>
        {artifact.unavailableNote
          ? renderUnavailable(artifact.unavailableNote)
          : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MarkdownPreview
        content={artifact.body}
        className="max-w-[680px] text-[17px] leading-8 text-primary"
      />
      {artifact.unavailableNote
        ? renderUnavailable(artifact.unavailableNote)
        : null}
    </div>
  );
}
