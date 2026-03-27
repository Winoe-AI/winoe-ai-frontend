import { toStringOrNull } from '@/features/candidate/api/base';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readErrorCode(record: Record<string, unknown> | null): string | null {
  if (!record) return null;
  const codeValue = record.errorCode ?? record.code;
  return toStringOrNull(codeValue);
}

export function getHandoffErrorCode(err: unknown): string | null {
  const root = asRecord(err);
  const details = asRecord(root?.details);
  const raw = asRecord(root?.raw);
  const rawDetails = asRecord(raw?.details);
  const nested = asRecord(details?.details);

  return (
    readErrorCode(details) ??
    readErrorCode(nested) ??
    readErrorCode(rawDetails) ??
    readErrorCode(root)
  );
}

export function getHandoffSourceDetails(err: unknown): unknown {
  return err && typeof err === 'object'
    ? (err as { details?: unknown }).details
    : undefined;
}
