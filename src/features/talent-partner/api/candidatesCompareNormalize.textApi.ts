import { toStringOrNull } from './trialUtilsApi';

function hasSensitiveQuery(url: URL): boolean {
  const sensitiveKeys = new Set([
    'x-amz-signature',
    'x-amz-credential',
    'x-amz-security-token',
    'x-goog-signature',
    'x-goog-credential',
    'googleaccessid',
    'signature',
    'sig',
    'token',
  ]);
  for (const key of url.searchParams.keys()) {
    if (sensitiveKeys.has(key.toLowerCase())) return true;
  }
  return false;
}

function isSensitiveText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  try {
    const parsed = new URL(trimmed);
    if (hasSensitiveQuery(parsed)) return true;
  } catch {
    if (/x-amz-signature=|x-goog-signature=|googleaccessid=/i.test(trimmed)) {
      return true;
    }
  }

  return false;
}

export function sanitizeText(value: unknown, maxLength = 140): string | null {
  const raw = toStringOrNull(value);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isSensitiveText(trimmed)) return null;
  return trimmed.slice(0, maxLength);
}

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item, 96))
      .filter((item): item is string => Boolean(item));
  }

  const raw = toStringOrNull(value);
  if (!raw) return [];

  const normalized = raw.trim();
  if (!normalized) return [];

  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((part) => sanitizeText(part, 96))
      .filter((item): item is string => Boolean(item));
  }

  const single = sanitizeText(normalized, 96);
  return single ? [single] : [];
}
