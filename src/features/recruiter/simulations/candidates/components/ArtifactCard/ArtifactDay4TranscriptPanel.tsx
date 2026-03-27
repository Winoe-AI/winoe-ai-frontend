import { useEffect, useMemo, useRef, useState } from 'react';
import type { HandoffTranscriptSegment } from '../../types';
import {
  buildTranscriptSearchResults,
  formatTranscriptTimestamp,
} from './day4Transcript';
type ArtifactDay4TranscriptPanelProps = {
  submissionId: number;
  transcriptIsReady: boolean;
  transcriptSegments: HandoffTranscriptSegment[];
  onSeek: (startMs: number) => void;
};
export function ArtifactDay4TranscriptPanel({
  submissionId,
  transcriptIsReady,
  transcriptSegments,
  onSeek,
}: ArtifactDay4TranscriptPanelProps) {
  const [query, setQuery] = useState('');
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { segments, totalMatches } = useMemo(
    () => buildTranscriptSearchResults(transcriptSegments, query),
    [query, transcriptSegments],
  );
  const firstMatchKey = useMemo(() => {
    if (!query.trim()) return null;
    const first = segments.find((segment) => segment.matchCount > 0);
    return first?.key ?? null;
  }, [query, segments]);
  useEffect(() => {
    if (!firstMatchKey) return;
    segmentRefs.current[firstMatchKey]?.scrollIntoView({ block: 'center' });
  }, [firstMatchKey]);
  if (!transcriptIsReady) {
    return (
      <div className="mt-2 text-sm text-gray-700">
        Processing transcript. Refresh shortly for searchable segments.
      </div>
    );
  }
  return (
    <>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label
          htmlFor={`transcript-search-${String(submissionId)}`}
          className="sr-only"
        >
          Search transcript
        </label>
        <input
          id={`transcript-search-${String(submissionId)}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transcript"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:max-w-sm"
        />
        <div className="text-xs text-gray-600">
          {query.trim() ? `${String(totalMatches)} matches` : 'Search for evidence'}
        </div>
      </div>
      <div className="mt-3 max-h-72 overflow-y-auto rounded border border-gray-100">
        {segments.map((entry) => (
          <div
            key={entry.key}
            ref={(node) => {
              segmentRefs.current[entry.key] = node;
            }}
            className={`border-b border-gray-100 p-3 last:border-b-0 ${
              entry.matchCount > 0 ? 'bg-amber-50' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSeek(entry.segment.startMs)}
              className="font-mono text-xs text-blue-700 underline"
              aria-label={`Seek to ${formatTranscriptTimestamp(entry.segment.startMs)}`}
            >
              {formatTranscriptTimestamp(entry.segment.startMs)}
            </button>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
              {entry.highlights.map((token, index) =>
                token.isMatch ? (
                  <mark key={`${entry.key}-mark-${String(index)}`}>{token.text}</mark>
                ) : (
                  <span key={`${entry.key}-text-${String(index)}`}>{token.text}</span>
                ),
              )}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
