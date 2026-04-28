import type { WinoeReportEvidence } from './winoeReport.types';
import {
  formatTranscriptTime,
  printableEvidenceUrl,
  safeExternalUrl,
} from './winoeReportFormatting';
import { formatEvidenceKindLabel } from './winoeReport.catalog';

type EvidenceListProps = {
  evidence: WinoeReportEvidence[];
  emptyMessage?: string;
};

export function EvidenceList({
  evidence,
  emptyMessage = 'No linked artifacts were returned for this dimension yet.',
}: EvidenceListProps) {
  if (evidence.length === 0) {
    return <p className="text-sm text-slate-600">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3" data-winoe-report-evidence-list="true">
      {evidence.map((item, index) => {
        const url = safeExternalUrl(item.url);
        const printableUrl = url ? printableEvidenceUrl(url) : null;
        const startLabel = formatTranscriptTime(item.startMs);
        const endLabel = formatTranscriptTime(item.endMs);
        const evidenceLabel = formatEvidenceKindLabel(item.kind);

        return (
          <li
            key={`${item.kind}-${item.ref ?? 'evidence'}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  {item.label ?? evidenceLabel}
                </div>
                {item.title ? (
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    {item.title}
                  </div>
                ) : null}
              </div>
              {item.dayLabel || item.sourceLabel ? (
                <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                  {item.dayLabel ?? item.sourceLabel}
                </div>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.description}
              </p>
            ) : null}
            {item.excerpt ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {item.excerpt}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              {item.ref ? (
                <span className="break-all">Ref: {item.ref}</span>
              ) : null}
              {item.dayIndex ? <span>Day {item.dayIndex}</span> : null}
              {startLabel || endLabel ? (
                <span>
                  Timestamp:{' '}
                  {startLabel && endLabel
                    ? `${startLabel} - ${endLabel}`
                    : (startLabel ?? endLabel)}
                </span>
              ) : null}
              {item.anchor ? <span>Anchor: {item.anchor}</span> : null}
            </div>
            {url ? (
              <div className="mt-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  Open evidence link
                </a>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                  URL: {printableUrl}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
