import type { FitProfileEvidence } from './fitProfile.types';
import {
  asRecord,
  toNullableString,
  toNumberOrNull,
} from './fitProfile.normalize.base';

export function normalizeEvidence(value: unknown): FitProfileEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  const kind = toNullableString(record.kind);
  if (!kind) return null;
  const startMs = toNumberOrNull(record.startMs ?? record.start_ms);
  const endMs = toNumberOrNull(record.endMs ?? record.end_ms);
  return {
    kind,
    ref: toNullableString(record.ref),
    url: toNullableString(record.url),
    excerpt: toNullableString(record.excerpt),
    startMs: startMs === null ? null : Math.max(0, Math.round(startMs)),
    endMs: endMs === null ? null : Math.max(0, Math.round(endMs)),
  };
}
