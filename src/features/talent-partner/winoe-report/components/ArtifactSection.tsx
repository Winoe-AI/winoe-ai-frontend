import type { RefObject } from 'react';
import { cn } from '@/shared/ui/classnames';
import type { WinoeArtifactViewModel } from '../winoeReport.viewModel';
import { ArtifactRenderer } from './ArtifactRenderer';

type Props = {
  artifact: WinoeArtifactViewModel;
  open: boolean;
  onToggle: () => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
};

export function ArtifactSection({ artifact, open, onToggle, videoRef }: Props) {
  return (
    <section className="rounded-3xl border border-subtle bg-elevated shadow-sm">
      <button
        type="button"
        className="group flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${artifact.id}-content`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-subtle bg-secondary text-sm text-secondary">
              {artifact.dayIndex}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                {artifact.title}
              </p>
              <p className="mt-1 truncate text-sm text-secondary">
                {artifact.preview}
              </p>
            </div>
          </div>
          {artifact.unavailableNote ? (
            <div className="mt-3 rounded-2xl border border-dashed border-subtle bg-secondary px-4 py-3 text-sm text-secondary">
              {artifact.unavailableNote.split('\n').map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
        <span className="mt-1 text-sm text-secondary transition group-hover:text-primary">
          {open ? 'Collapse' : 'Expand'}
        </span>
      </button>

      <div
        id={`${artifact.id}-content`}
        className={cn(
          'collapsible-content overflow-hidden border-t border-subtle px-5 py-5',
          open ? 'block' : 'hidden',
        )}
      >
        <ArtifactRenderer artifact={artifact} videoRef={videoRef} />
      </div>
    </section>
  );
}
