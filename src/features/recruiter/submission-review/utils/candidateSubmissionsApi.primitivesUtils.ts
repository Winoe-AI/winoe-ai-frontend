const TRUE_STRINGS = new Set(['true', '1', 'yes']);
const FALSE_STRINGS = new Set(['false', '0', 'no']);

export const isAbortError = (err: unknown) =>
  (err instanceof DOMException && err.name === 'AbortError') ||
  (err &&
    typeof err === 'object' &&
    (err as { name?: unknown }).name === 'AbortError');

export function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toIsoOrNull(value: unknown): string | null {
  const iso = toNullableString(value);
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (TRUE_STRINGS.has(normalized)) return true;
  if (FALSE_STRINGS.has(normalized)) return false;
  return null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
