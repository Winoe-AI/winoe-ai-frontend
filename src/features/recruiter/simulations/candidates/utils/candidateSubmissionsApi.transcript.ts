import type { HandoffTranscript, HandoffTranscriptSegment } from '../types';
import { asRecord, toNullableNumber, toNullableString } from './candidateSubmissionsApi.primitives';

function normalizeTranscriptSegment(value: unknown): HandoffTranscriptSegment | null {
  const record = asRecord(value);
  if (!record) return null;
  const startMs = toNullableNumber(record.startMs ?? record.start_ms);
  const endMs = toNullableNumber(record.endMs ?? record.end_ms);
  const text = toNullableString(record.text);
  if (startMs === null || endMs === null || text === null) return null;
  const roundedStartMs = Math.max(0, Math.round(startMs));
  const roundedEndMs = Math.max(roundedStartMs, Math.round(endMs));
  const id = toNullableString(record.id);
  return { id, startMs: roundedStartMs, endMs: roundedEndMs, text };
}

function normalizeTranscriptSegments(value: unknown): HandoffTranscriptSegment[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map(normalizeTranscriptSegment)
    .filter((segment): segment is HandoffTranscriptSegment => Boolean(segment));
}

export function normalizeTranscript(handoffRecord: Record<string, unknown>): HandoffTranscript | null {
  const transcriptRecord = asRecord(handoffRecord.transcript);
  const fallbackStatus = toNullableString(handoffRecord.transcriptStatus ?? handoffRecord.transcript_status) ?? null;
  const fallbackText = toNullableString(handoffRecord.transcriptText ?? handoffRecord.transcript_text) ?? null;
  const fallbackSegments = normalizeTranscriptSegments(handoffRecord.transcriptSegments ?? handoffRecord.transcript_segments) ?? null;

  const status = toNullableString(transcriptRecord?.status ?? transcriptRecord?.state) ?? fallbackStatus;
  const text = toNullableString(transcriptRecord?.text) ?? fallbackText;
  const segments = normalizeTranscriptSegments(transcriptRecord?.segments) ?? fallbackSegments;

  if (!status && !text && !segments) return null;
  return { status: status ?? 'not_started', text, segments: segments ?? [] };
}
