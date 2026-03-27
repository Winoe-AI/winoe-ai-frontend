import { toNumberOrNull, toStringOrNull } from './simUtils';

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeStatus(value: unknown): string | null {
  const raw = toStringOrNull(value);
  return raw ? raw.toLowerCase() : null;
}

export function toUnitIntervalOrNull(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) return null;
  if (parsed > 1 && parsed <= 100) {
    return Math.min(1, Math.max(0, parsed / 100));
  }
  return Math.min(1, Math.max(0, parsed));
}
