'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { Card } from '@/shared/ui/Card';
import { formatTranscriptTimestamp } from './ArtifactCard/day4Transcript';
import type {
  SubmissionReviewDemoDay as SubmissionReviewDemoDayPayload,
  SubmissionReviewTranscriptSegment,
} from '../../api';

type Props = {
  day: SubmissionReviewDemoDayPayload | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  currentTime: number;
  onTimeUpdate: (value: number) => void;
  onSeek: (startMs: number) => void;
  pendingSeekMs: number | null;
  onMetadataLoaded: () => void;
};

function TranscriptVideoPlayer({
  videoUrl,
  posterUrl,
  onTimeUpdate,
  videoRef,
  onLoadedMetadata,
}: {
  videoUrl: string | null | undefined;
  posterUrl: string | null | undefined;
  onTimeUpdate: (currentTime: number) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  onLoadedMetadata: () => void;
}) {
  if (!videoUrl) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-subtle bg-secondary px-6 text-sm text-secondary">
        No Handoff + Demo video is available for this candidate yet.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      playsInline
      src={videoUrl}
      poster={posterUrl ?? undefined}
      className="w-full rounded-2xl border border-subtle bg-black"
      onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
      onLoadedMetadata={onLoadedMetadata}
      onLoadedData={onLoadedMetadata}
      onCanPlay={onLoadedMetadata}
    />
  );
}

function TranscriptSegmentList({
  segments,
  currentTime,
  onSeek,
}: {
  segments: SubmissionReviewTranscriptSegment[];
  currentTime: number;
  onSeek: (startMs: number) => void;
}) {
  const activeIndex = segments.findIndex((segment, index) => {
    const nextStart = segments[index + 1]?.startMs ?? Number.POSITIVE_INFINITY;
    return (
      currentTime >= segment.startMs / 1000 && currentTime < nextStart / 1000
    );
  });

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (activeIndex < 0) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="max-h-[620px] overflow-auto rounded-2xl border border-subtle bg-elevated p-3">
      <div className="space-y-2">
        {segments.map((segment, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={`${segment.startMs}-${index}`}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              onClick={() => onSeek(segment.startMs)}
              className={[
                'w-full rounded-xl border p-3 text-left transition',
                active
                  ? 'border-wheat-300 bg-wheat-50 shadow-sm'
                  : 'border-subtle bg-secondary hover:bg-elevated',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                  {formatTranscriptTimestamp(segment.startMs)}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-primary">
                  {segment.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SubmissionReviewTranscriptPanel({
  day,
  videoRef,
  currentTime,
  onTimeUpdate,
  onSeek,
  pendingSeekMs,
  onMetadataLoaded,
}: Props) {
  const transcript = day?.transcript ?? null;
  const segments = useMemo(() => transcript?.segments ?? [], [transcript]);
  const transcriptText = transcript?.text?.trim() ?? '';

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-primary">
            Handoff + Demo
          </h2>
          <div className="flex flex-wrap gap-3 text-sm text-secondary">
            <span>
              Submitted{' '}
              {day?.submittedAt
                ? new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(day.submittedAt))
                : 'Not submitted yet'}
            </span>
            {typeof day?.durationSeconds === 'number' ? (
              <span>{Math.round(day.durationSeconds / 60)} min</span>
            ) : null}
          </div>
        </header>

        <TranscriptVideoPlayer
          videoUrl={day?.videoUrl}
          posterUrl={day?.posterUrl}
          videoRef={videoRef}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onMetadataLoaded}
        />

        {day?.supplementalMaterials?.length ? (
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                Supplemental materials
              </h3>
              <ul className="space-y-2">
                {day.supplementalMaterials.map((material) => (
                  <li
                    key={material.recordingId}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-subtle bg-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">
                        {material.recordingId}
                      </p>
                      <p className="mt-1 text-xs text-secondary">
                        {material.contentType}
                        {material.bytes ? ` · ${material.bytes} bytes` : ''}
                      </p>
                    </div>
                    {material.downloadUrl ? (
                      <a
                        href={material.downloadUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-medium text-wheat-700 hover:underline"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-sm text-secondary">
                        Unavailable
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="space-y-3">
        <header className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-primary">
            Transcript
          </h3>
          <p className="text-sm text-secondary">
            {segments.length > 0
              ? 'Click any segment to seek the video.'
              : transcriptText
                ? 'Transcript text is available, but no searchable segments were returned.'
                : 'Transcript is not available yet. The video is still reviewable.'}
          </p>
        </header>
        {segments.length > 0 ? (
          <TranscriptSegmentList
            segments={segments}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        ) : transcriptText ? (
          <Card className="border-dashed">
            <p className="whitespace-pre-wrap text-sm leading-6 text-primary">
              {transcriptText}
            </p>
          </Card>
        ) : (
          <Card className="border-dashed">
            <p className="text-sm text-secondary">
              Transcript is not available yet. The video is still reviewable.
            </p>
          </Card>
        )}
        {pendingSeekMs !== null ? (
          <p className="text-xs text-secondary">
            Seeking to {formatTranscriptTimestamp(pendingSeekMs)} when the video
            metadata finishes loading.
          </p>
        ) : null}
      </div>
    </section>
  );
}
