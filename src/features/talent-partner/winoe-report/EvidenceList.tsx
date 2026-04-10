import type { WinoeReportEvidence } from './winoeReport.types';
import {
  formatTranscriptTime,
  printableEvidenceUrl,
  safeExternalUrl,
} from './winoeReportFormatting';

type EvidenceListProps = {
  evidence: WinoeReportEvidence[];
};

function formatEvidenceTitle(kind: string): string {
  const normalized = kind.trim().toLowerCase();
  if (normalized === 'commit') return 'Commit Evidence';
  if (normalized === 'diff') return 'Diff Evidence';
  if (normalized === 'test') return 'Test Evidence';
  if (normalized === 'transcript') return 'Transcript Evidence';
  return `${kind.replace(/[_-]/g, ' ')} evidence`;
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No evidence recorded for this day.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {evidence.map((item, index) => {
        const url = safeExternalUrl(item.url);
        const printableUrl = url ? printableEvidenceUrl(url) : null;
        const startLabel = formatTranscriptTime(item.startMs);
        const endLabel = formatTranscriptTime(item.endMs);

        return (
          <li
            key={`${item.kind}-${item.ref ?? 'evidence'}-${index}`}
            className="rounded border border-gray-200 bg-gray-50 p-3"
          >
            <div className="text-sm font-semibold text-gray-900">
              {formatEvidenceTitle(item.kind)}
            </div>
            {item.ref ? (
              <p className="mt-1 break-all font-mono text-xs text-gray-600">
                Ref: {item.ref}
              </p>
            ) : null}
            {item.excerpt ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {item.excerpt}
              </p>
            ) : null}
            {startLabel || endLabel ? (
              <p className="mt-2 text-xs text-gray-600">
                Timestamp:{' '}
                {startLabel && endLabel
                  ? `${startLabel} - ${endLabel}`
                  : (startLabel ?? endLabel)}
              </p>
            ) : null}
            {url ? (
              <div className="mt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-blue-700 hover:underline"
                >
                  Open evidence link
                </a>
                <p className="mt-1 break-all font-mono text-xs text-gray-600">
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
