'use client';

import { useRef, useState } from 'react';
import type { HandoffTranscriptSegment, SubmissionArtifact } from '../../types';
import { ArtifactDay4TranscriptPanel } from './ArtifactDay4TranscriptPanel';
import { ArtifactDay4VideoPanel } from './ArtifactDay4VideoPanel';
import {
  isTranscriptReady,
  normalizeHandoffStatus,
} from './artifactDay4Status';

type Props = {
  artifact: SubmissionArtifact;
};

const EMPTY_TRANSCRIPT_SEGMENTS: HandoffTranscriptSegment[] = [];

export function ArtifactDay4Handoff({ artifact }: Props) {
  const handoff = artifact.handoff ?? null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const downloadUrl = handoff?.downloadUrl ?? null;
  const transcript = handoff?.transcript ?? null;
  const transcriptStatus = transcript?.status ?? 'processing';
  const transcriptSegments = transcript?.segments ?? EMPTY_TRANSCRIPT_SEGMENTS;
  const transcriptIsReady =
    isTranscriptReady(transcriptStatus) && transcriptSegments.length > 0;
  const deleted =
    handoff?.isDeleted === true || Boolean(handoff?.deletedAt ?? null);
  const unavailableByStatus = ['forbidden', 'unavailable', 'deleted'].includes(
    normalizeHandoffStatus(handoff?.recordingStatus),
  );
  const videoUnavailable = Boolean(
    downloadUrl && failedVideoUrl === downloadUrl,
  );
  const shouldHidePlayer =
    deleted || unavailableByStatus || videoUnavailable || !downloadUrl;

  const onSeek = (startMs: number) => {
    const player = videoRef.current;
    if (!player) return;
    try {
      player.currentTime = Math.max(0, startMs / 1000);
    } catch {}
  };

  return (
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
      <div className="text-sm font-semibold text-gray-900">
        Day 4 presentation playback
      </div>
      <div className="mt-2">
        <ArtifactDay4VideoPanel
          videoRef={videoRef}
          shouldHidePlayer={shouldHidePlayer}
          downloadUrl={downloadUrl}
          deleted={deleted}
          onVideoError={setFailedVideoUrl}
        />
      </div>

      <div className="mt-3 rounded border border-gray-200 bg-white p-3">
        <div className="text-sm font-semibold text-gray-900">Transcript</div>
        <ArtifactDay4TranscriptPanel
          submissionId={artifact.submissionId}
          transcriptIsReady={transcriptIsReady}
          transcriptSegments={transcriptSegments}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
}
