import type { HandoffTranscriptSegment } from './handoffApi';
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_DEMO_VIDEO_DURATION_SECONDS,
} from './panelConstants';

export function toUploadErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    const value = String((err as { message: string }).message).trim();
    if (value) return value;
  }
  return fallback;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return 'Unknown duration';
  return formatTimestamp(Math.max(0, Math.round(seconds)) * 1000);
}

export function formatSegmentRange(segment: HandoffTranscriptSegment): string {
  return `${formatTimestamp(segment.startMs)} - ${formatTimestamp(segment.endMs)}`;
}

export function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return 'Unsupported file type. Upload MP4, WebM, or MOV video files.';
  }
  return null;
}

function readVideoDurationFromObjectUrl(params: {
  objectUrl: string;
  revokeOnFinish: boolean;
}): Promise<number> {
  const { objectUrl, revokeOnFinish } = params;
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      video.removeAttribute('src');
      video.load();
      if (revokeOnFinish) URL.revokeObjectURL(objectUrl);
      fn();
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const { duration } = video;
      finish(() => {
        if (Number.isFinite(duration) && duration > 0) {
          resolve(duration);
          return;
        }
        reject(new Error('Unable to read demo video duration.'));
      });
    };
    video.onerror = () => {
      finish(() =>
        reject(
          new Error(
            'Unable to read demo video metadata. Try another video file.',
          ),
        ),
      );
    };
    video.src = objectUrl;
  });
}

export function readVideoDurationSeconds(file: File): Promise<number> {
  return readVideoDurationFromObjectUrl({
    objectUrl: URL.createObjectURL(file),
    revokeOnFinish: true,
  });
}

export async function validateVideoDuration(
  file: File,
  objectUrl?: string,
): Promise<number> {
  const durationSeconds = objectUrl
    ? await readVideoDurationFromObjectUrl({
        objectUrl,
        revokeOnFinish: false,
      })
    : await readVideoDurationSeconds(file);
  if (durationSeconds > MAX_DEMO_VIDEO_DURATION_SECONDS) {
    throw new Error(
      `Demo video must be 15 minutes or shorter. Selected video is ${formatDuration(
        durationSeconds,
      )}.`,
    );
  }
  return Math.max(1, Math.round(durationSeconds));
}
