import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/candidate/api/base';

const DELETED_RECORDING_STATUSES = new Set(['deleted', 'purged']);

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeProgressPct(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export function toBooleanOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['true', '1', 'yes', 'accepted', 'consented'].includes(normalized))
    return true;
  if (['false', '0', 'no', 'rejected', 'declined'].includes(normalized))
    return false;
  return null;
}

export function toIsoOrNull(value: unknown): string | null {
  const iso = toStringOrNull(value);
  if (!iso) return null;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? iso : null;
}

export function isDeletedRecordingStatus(value: string | null): boolean {
  if (!value) return false;
  return DELETED_RECORDING_STATUSES.has(value.trim().toLowerCase());
}
