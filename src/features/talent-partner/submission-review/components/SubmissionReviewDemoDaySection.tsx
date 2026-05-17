'use client';

import { useEffect, useRef, useState } from 'react';
import type { SubmissionReviewDemoDay as SubmissionReviewDemoDayPayload } from '../../api';
import { SubmissionReviewTranscriptPanel } from './SubmissionReviewTranscriptPanel';

type Props = {
  day: SubmissionReviewDemoDayPayload | null;
};

const MEDIA_READY_EVENTS = ['loadedmetadata', 'loadeddata', 'canplay'] as const;

function getSeekSeconds(startMs: number) {
  const seekSeconds = startMs / 1000;
  return Number.isFinite(seekSeconds) && seekSeconds >= 0 ? seekSeconds : null;
}

function canApplySeek(video: HTMLVideoElement, seekSeconds: number) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return false;
  }

  try {
    return (
      video.seekable.length > 0 &&
      video.seekable.end(video.seekable.length - 1) >= seekSeconds
    );
  } catch {
    return false;
  }
}

export function SubmissionReviewDemoDaySection({ day }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [pendingSeekMs, setPendingSeekMs] = useState<number | null>(null);

  const trySeekVideo = (seekSeconds: number) => {
    const video = videoRef.current;
    if (!video || !canApplySeek(video, seekSeconds)) {
      return false;
    }

    try {
      video.currentTime = seekSeconds;
      setCurrentTime(video.currentTime || seekSeconds);
      setPendingSeekMs(null);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (pendingSeekMs === null) return;

    const seekSeconds = getSeekSeconds(pendingSeekMs);
    const video = videoRef.current;
    if (seekSeconds === null || !video) return;

    let cancelled = false;

    const attemptSeek = () => {
      if (cancelled) return;
      trySeekVideo(seekSeconds);
    };

    queueMicrotask(attemptSeek);
    MEDIA_READY_EVENTS.forEach((eventName) => {
      video.addEventListener(eventName, attemptSeek);
    });

    return () => {
      cancelled = true;
      MEDIA_READY_EVENTS.forEach((eventName) => {
        video.removeEventListener(eventName, attemptSeek);
      });
    };
  }, [pendingSeekMs]);

  return (
    <SubmissionReviewTranscriptPanel
      day={day}
      videoRef={videoRef}
      currentTime={currentTime}
      onTimeUpdate={setCurrentTime}
      pendingSeekMs={pendingSeekMs}
      onSeek={(startMs) => {
        const seekSeconds = getSeekSeconds(startMs);
        if (seekSeconds === null) {
          setCurrentTime(0);
          setPendingSeekMs(startMs);
          return;
        }
        setCurrentTime(seekSeconds);
        if (!trySeekVideo(seekSeconds)) {
          setPendingSeekMs(startMs);
        }
      }}
      onMetadataLoaded={() => {
        if (pendingSeekMs === null) return;
        const seekSeconds = getSeekSeconds(pendingSeekMs);
        if (seekSeconds === null) return;
        trySeekVideo(seekSeconds);
      }}
    />
  );
}
