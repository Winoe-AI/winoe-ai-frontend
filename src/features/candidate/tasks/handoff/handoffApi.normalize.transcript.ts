import {
  toIdString,
  toNumberOrNull,
  toStringOrNull,
} from '@/features/candidate/session/api/baseApi';
import { asRecord } from './handoffApi.normalize.shared';
import type { HandoffTranscriptSegment } from './handoffApi.types';

function normalizeTranscriptSegment(
  raw: unknown,
): HandoffTranscriptSegment | null {
  const record = asRecord(raw);
  if (!record) return null;

  const startMs = toNumberOrNull(record.startMs ?? record.start_ms);
  const endMs = toNumberOrNull(record.endMs ?? record.end_ms);
  const text = toStringOrNull(record.text);
  if (startMs === null || endMs === null || text === null) return null;

  const roundedStartMs = Math.max(0, Math.round(startMs));
  const roundedEndMs = Math.max(roundedStartMs, Math.round(endMs));

  return {
    id: toIdString(record.id),
    startMs: roundedStartMs,
    endMs: roundedEndMs,
    text,
  };
}

export function normalizeTranscriptSegments(
  value: unknown,
): HandoffTranscriptSegment[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map(normalizeTranscriptSegment)
    .filter((segment): segment is HandoffTranscriptSegment => Boolean(segment));
}
