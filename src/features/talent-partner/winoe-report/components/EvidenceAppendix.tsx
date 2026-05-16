import type { WinoeReportViewModel } from '../winoeReport.viewModel';
import { groupCitationsByArtifactGroup } from '../utils/citationGrouping';
import {
  formatCitationArtifactBody,
  formatCitationTimeRange,
} from '../utils/citationFormatting';
import { formatDimensionScore as formatDimensionScoreLabel } from '../utils/reportFormatting';

type Props = {
  dimensions: WinoeReportViewModel['dimensions'];
};

function renderCitationExcerpt(
  renderMode: 'markdown' | 'code' | 'demo' | 'reflection',
  excerpt: string,
  artifactRef: string,
  timeLabel: string | null,
) {
  if (renderMode === 'code') {
    return (
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-subtle bg-elevated p-4 font-mono text-[13px] leading-6 text-primary">
        {formatCitationArtifactBody(renderMode, artifactRef, excerpt)}
      </pre>
    );
  }
  if (renderMode === 'demo') {
    return (
      <div className="mt-2 rounded-xl border border-subtle bg-elevated p-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">
          Transcript
        </p>
        {timeLabel ? (
          <p className="mt-1 font-mono text-xs text-secondary">{timeLabel}</p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap font-mono text-[13px] leading-6 text-primary">
          {formatCitationArtifactBody(renderMode, artifactRef, excerpt)}
        </p>
      </div>
    );
  }
  return (
    <blockquote className="mt-2 border-l-2 border-wheat-300 pl-4 text-sm leading-6 text-primary">
      {excerpt}
    </blockquote>
  );
}

export function EvidenceAppendix({ dimensions }: Props) {
  return (
    <section className="evidence-appendix hidden print:block">
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
            Print appendix
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-primary">
            Evidence Appendix
          </h2>
          <p className="mt-2 max-w-[680px] text-sm leading-6 text-secondary">
            The drawer is hidden in print, so this appendix preserves the
            traceability trail in the exported PDF.
          </p>
        </header>
        <div className="space-y-8">
          {dimensions.map((dimension) => (
            <section
              key={dimension.id}
              className="break-inside-avoid rounded-3xl border border-subtle bg-elevated p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                    {dimension.name}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-primary">
                    {formatDimensionScoreLabel(dimension.score)}
                  </h3>
                </div>
              </div>
              <p className="mt-3 max-w-[680px] text-sm leading-6 text-secondary">
                {dimension.justification}
              </p>
              <div className="mt-4 space-y-4">
                {dimension.citations.length === 0 ? (
                  <p className="text-sm text-secondary">
                    Evidence is unavailable for this dimension yet.
                  </p>
                ) : (
                  groupCitationsByArtifactGroup(dimension.citations).map(
                    ([groupLabel, citations]) => (
                      <section key={groupLabel} className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                          {groupLabel}
                        </h4>
                        <div className="space-y-4">
                          {citations.map((citation) => (
                            <article
                              key={citation.id}
                              className="rounded-2xl border border-subtle bg-secondary p-4"
                            >
                              <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">
                                {citation.groupLabel} · {citation.artifactRef}
                              </p>
                              {citation.dayLabel || citation.dayIndex ? (
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-tertiary">
                                  {citation.dayLabel ??
                                    `Day ${citation.dayIndex}`}
                                </p>
                              ) : null}
                              {formatCitationTimeRange(
                                citation.startMs,
                                citation.endMs,
                              ) ? (
                                <p className="mt-1 font-mono text-xs text-secondary">
                                  {formatCitationTimeRange(
                                    citation.startMs,
                                    citation.endMs,
                                  )}
                                </p>
                              ) : null}
                              {renderCitationExcerpt(
                                citation.renderMode,
                                citation.excerpt,
                                citation.artifactRef,
                                formatCitationTimeRange(
                                  citation.startMs,
                                  citation.endMs,
                                ),
                              )}
                            </article>
                          ))}
                        </div>
                      </section>
                    ),
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
