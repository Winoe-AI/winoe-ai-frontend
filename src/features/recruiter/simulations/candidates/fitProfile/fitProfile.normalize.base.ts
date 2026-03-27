export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function toUnitInterval(value: unknown): number {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return 0;
  if (numeric > 1 && numeric <= 100) return Math.min(1, numeric / 100);
  return Math.min(1, Math.max(0, numeric));
}

export function toUnitIntervalOrNull(value: unknown): number | null {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return null;
  if (numeric > 1 && numeric <= 100) return Math.min(1, numeric / 100);
  return Math.min(1, Math.max(0, numeric));
}

export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNullableString(item))
    .filter((item): item is string => Boolean(item));
}

export function toPositiveIntList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null && item > 0)
    .map((item) => Math.round(item));
}

export function normalizeStatus(value: unknown): string | null {
  const status = toNullableString(value);
  return status ? status.toLowerCase() : null;
}
