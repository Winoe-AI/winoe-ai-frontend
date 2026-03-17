'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { HandoffTranscriptSegment, SubmissionArtifact } from '../../types';
import {
  buildTranscriptSearchResults,
  formatTranscriptTimestamp,
} from './day4Transcript';

function normalizeStatus(status: string | null | undefined): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

function isTranscriptReady(status: string | null | undefined): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === 'ready' ||
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'done' ||
    normalized === 'succeeded' ||
    normalized === 'success'
  );
}

type Props = {
  artifact: SubmissionArtifact;
};

const EMPTY_TRANSCRIPT_SEGMENTS: HandoffTranscriptSegment[] = [];

export function ArtifactDay4Handoff({ artifact }: Props) {
  const handoff = artifact.handoff ?? null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const downloadUrl = handoff?.downloadUrl ?? null;
  const transcript = handoff?.transcript ?? null;
  const transcriptStatus = transcript?.status ?? 'processing';
  const transcriptSegments = transcript?.segments ?? EMPTY_TRANSCRIPT_SEGMENTS;
  const transcriptIsReady =
    isTranscriptReady(transcriptStatus) && transcriptSegments.length > 0;
  const deleted =
    handoff?.isDeleted === true || Boolean(handoff?.deletedAt ?? null);
  const unavailableByStatus = ['forbidden', 'unavailable', 'deleted'].includes(
    normalizeStatus(handoff?.recordingStatus),
  );
  const videoUnavailable = Boolean(
    downloadUrl && failedVideoUrl === downloadUrl,
  );
  const shouldHidePlayer =
    deleted || unavailableByStatus || videoUnavailable || !downloadUrl;

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
    segmentRefs.current[firstMatchKey]?.scrollIntoView({
      block: 'center',
    });
  }, [firstMatchKey]);

  const onSeek = (startMs: number) => {
    const player = videoRef.current;
    if (!player) return;
    try {
      player.currentTime = Math.max(0, startMs / 1000);
    } catch {}
  };

  return (
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
      <div className="text-sm font-semibold text-gray-900">Day 4 playback</div>
      <div className="mt-2">
        {!shouldHidePlayer && downloadUrl ? (
          <>
            <video
              ref={videoRef}
              controls
              preload="metadata"
              className="w-full rounded border border-gray-200 bg-black"
              src={downloadUrl}
              onError={() => setFailedVideoUrl(downloadUrl)}
            />
            <a
              className="mt-2 inline-block text-sm text-blue-600 underline"
              href={downloadUrl}
              download
            >
              Download video
            </a>
          </>
        ) : (
          <div className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-700">
            {deleted
              ? 'Video deleted or unavailable.'
              : 'Video unavailable right now.'}
          </div>
        )}
      </div>

      <div className="mt-3 rounded border border-gray-200 bg-white p-3">
        <div className="text-sm font-semibold text-gray-900">Transcript</div>
        {!transcriptIsReady ? (
          <div className="mt-2 text-sm text-gray-700">
            Processing transcript. Refresh shortly for searchable segments.
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor={`transcript-search-${String(artifact.submissionId)}`}
                className="sr-only"
              >
                Search transcript
              </label>
              <input
                id={`transcript-search-${String(artifact.submissionId)}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search transcript"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:max-w-sm"
              />
              <div className="text-xs text-gray-600">
                {query.trim()
                  ? `${String(totalMatches)} matches`
                  : 'Search for evidence'}
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
                        <mark key={`${entry.key}-mark-${String(index)}`}>
                          {token.text}
                        </mark>
                      ) : (
                        <span key={`${entry.key}-text-${String(index)}`}>
                          {token.text}
                        </span>
                      ),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
