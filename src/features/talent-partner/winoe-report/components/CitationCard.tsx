import Button from '@/shared/ui/Button';
import { MarkdownPreview } from '@/shared/ui/Markdown';
import type { WinoeCitationViewModel } from '../winoeReport.viewModel';
import {
  formatCitationTimeRange,
  normalizeExcerpt,
  parseLineRangeLabel,
} from '../utils/citationFormatting';
import {
  printableEvidenceUrl,
  safeExternalUrl,
} from '../winoeReportFormatting.url';

type Props = {
  citation: WinoeCitationViewModel;
  onOpen: (citation: WinoeCitationViewModel) => void;
  onSeekDemo: (citation: WinoeCitationViewModel) => void;
};

function renderExcerpt(citation: WinoeCitationViewModel) {
  const timeLabel = formatCitationTimeRange(citation.startMs, citation.endMs);
  if (citation.renderMode === 'code') {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-subtle bg-secondary p-3 font-mono text-[13px] leading-6 text-primary">
        {normalizeExcerpt(citation.excerpt)}
      </pre>
    );
  }
  if (citation.renderMode === 'demo') {
    return (
      <div className="space-y-2">
        {timeLabel ? (
          <p className="font-mono text-xs text-secondary">{timeLabel}</p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-6 text-primary">
          {citation.excerpt}
        </p>
      </div>
    );
  }
  if (citation.renderMode === 'reflection') {
    return (
      <MarkdownPreview
        content={citation.excerpt}
        className="text-sm leading-6 text-primary"
      />
    );
  }
  return (
    <blockquote className="border-l-2 border-wheat-300 pl-4 text-sm leading-6 text-primary">
      {citation.excerpt}
    </blockquote>
  );
}

export function CitationCard({ citation, onOpen, onSeekDemo }: Props) {
  const lineRangeLabel = parseLineRangeLabel(citation.lineRange);
  const timeLabel = formatCitationTimeRange(citation.startMs, citation.endMs);

  return (
    <article className="group rounded-2xl border border-subtle bg-elevated p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">
            {lineRangeLabel ?? citation.artifactRef}
          </p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {citation.groupLabel}
          </p>
          {citation.title ? (
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-tertiary">
              {citation.title}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpen(citation)}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            View
          </Button>
          {citation.renderMode === 'demo' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeekDemo(citation)}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              disabled={citation.startMs === null}
            >
              Seek
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="rounded-xl border border-subtle bg-secondary p-3">
          {renderExcerpt(citation)}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-secondary">
          <span className="font-mono">{citation.artifactRef}</span>
          {lineRangeLabel ? (
            <span className="font-mono">{lineRangeLabel}</span>
          ) : null}
          {timeLabel ? <span className="font-mono">{timeLabel}</span> : null}
        </div>
        {citation.url ? (
          <div className="space-y-1">
            <a
              href={safeExternalUrl(citation.url) ?? citation.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-medium text-wheat-700 hover:underline"
            >
              Open evidence link
            </a>
            <p className="break-all font-mono text-xs text-secondary">
              URL: {printableEvidenceUrl(citation.url)}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
