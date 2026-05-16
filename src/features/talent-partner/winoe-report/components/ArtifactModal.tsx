import type { WinoeCitationViewModel } from '../winoeReport.viewModel';
import { ModalShell } from './ModalShell';
import { ArtifactRenderer } from './ArtifactRenderer';
import {
  formatCitationArtifactBody,
  formatCitationTimeRange,
  parseLineRangeLabel,
} from '../utils/citationFormatting';

type Props = {
  open: boolean;
  citation: WinoeCitationViewModel | null;
  onClose: () => void;
};

export function ArtifactModal({ open, citation, onClose }: Props) {
  if (!citation) return null;
  const lineRangeLabel = parseLineRangeLabel(citation.lineRange);
  const timeLabel = formatCitationTimeRange(citation.startMs, citation.endMs);
  const kind =
    citation.renderMode === 'demo'
      ? 'video'
      : citation.renderMode === 'code'
        ? 'code'
        : citation.renderMode === 'reflection'
          ? 'reflection'
          : 'markdown';

  return (
    <ModalShell open={open} title="Artifact preview" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-subtle bg-secondary p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">
            {citation.artifactRef}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-secondary">
            <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
              {citation.groupLabel}
            </span>
            <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
              {citation.renderMode}
            </span>
            {lineRangeLabel ? (
              <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
                {lineRangeLabel}
              </span>
            ) : null}
            {timeLabel ? (
              <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
                {timeLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-subtle bg-elevated p-4">
          <p className="text-sm font-semibold text-primary">Excerpt</p>
          <div className="mt-3 rounded-xl border border-subtle bg-secondary p-4">
            <ArtifactRenderer
              artifact={{
                id: 'citation-preview',
                title: citation.groupLabel,
                dayIndex: (citation.dayIndex ?? 1) as 1 | 2 | 3 | 4 | 5,
                kind,
                preview: citation.excerpt,
                body:
                  citation.renderMode === 'code' ||
                  citation.renderMode === 'demo'
                    ? formatCitationArtifactBody(
                        citation.renderMode,
                        citation.artifactRef,
                        citation.excerpt,
                      )
                    : citation.excerpt,
                citations: [],
                videoUrl: citation.renderMode === 'demo' ? null : citation.url,
                transcript: citation.excerpt,
                unavailableNote: null,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-subtle bg-secondary p-4 text-sm leading-6 text-secondary">
          Full artifact rendering is not available yet. The cited excerpt and
          artifact reference are preserved below.
        </div>
      </div>
    </ModalShell>
  );
}
