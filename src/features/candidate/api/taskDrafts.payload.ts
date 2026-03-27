import { HttpError } from '@/lib/api/errors/errors';
import {
  DRAFT_CONTENT_TOO_LARGE,
  MAX_DRAFT_CONTENT_BYTES,
} from './taskDrafts.constants';
import type { CandidateTaskDraftPayload } from './taskDrafts.types';

function utf8ByteSize(value: string | null | undefined): number {
  if (typeof value !== 'string') return 0;
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf-8');
  if (typeof Blob !== 'undefined') return new Blob([value]).size;
  return value.length;
}

function jsonByteSize(value: Record<string, unknown> | null | undefined): number {
  if (!value) return 0;
  try {
    return utf8ByteSize(JSON.stringify(value, null, 0));
  } catch {
    return MAX_DRAFT_CONTENT_BYTES + 1;
  }
}

function buildTooLargeError(
  field: 'contentText' | 'contentJson',
  actualBytes: number,
): HttpError {
  const error = new HttpError(
    413,
    `${field} exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes.`,
  );
  (error as { details?: unknown }).details = {
    errorCode: DRAFT_CONTENT_TOO_LARGE,
    details: { field, maxBytes: MAX_DRAFT_CONTENT_BYTES, actualBytes },
  };
  return error;
}

export function enforcePayloadBounds(payload: CandidateTaskDraftPayload) {
  const textBytes = utf8ByteSize(payload.contentText);
  if (textBytes > MAX_DRAFT_CONTENT_BYTES) {
    throw buildTooLargeError('contentText', textBytes);
  }

  const jsonBytes = jsonByteSize(payload.contentJson);
  if (jsonBytes > MAX_DRAFT_CONTENT_BYTES) {
    throw buildTooLargeError('contentJson', jsonBytes);
  }
}
