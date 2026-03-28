export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function readCode(
  record: Record<string, unknown> | null,
): string | null {
  if (!record) return null;
  const errorCode = record.errorCode;
  if (typeof errorCode === 'string' && errorCode.trim())
    return errorCode.trim();
  const code = record.code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  return null;
}

export function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const iso = value.trim();
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return iso;
}

export function toTimestamp(iso: string | null): number | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return null;
  return ts;
}
