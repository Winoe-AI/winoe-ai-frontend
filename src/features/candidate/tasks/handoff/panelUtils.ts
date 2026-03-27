import type { HandoffTranscriptSegment } from './handoffApi';
import { ACCEPTED_VIDEO_TYPES } from './panelConstants';

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

export function formatSegmentRange(segment: HandoffTranscriptSegment): string {
  return `${formatTimestamp(segment.startMs)} - ${formatTimestamp(segment.endMs)}`;
}

export function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return 'Unsupported file type. Upload MP4, WebM, or MOV video files.';
  }
  return null;
}
