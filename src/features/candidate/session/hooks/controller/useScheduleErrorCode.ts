export function scheduleErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const details = (err as { details?: unknown }).details;
  if (!details || typeof details !== 'object') return null;
  const record = details as Record<string, unknown>;
  if (typeof record.errorCode === 'string' && record.errorCode.trim()) {
    return record.errorCode.trim();
  }
  if (typeof record.code === 'string' && record.code.trim()) {
    return record.code.trim();
  }
  return null;
}
