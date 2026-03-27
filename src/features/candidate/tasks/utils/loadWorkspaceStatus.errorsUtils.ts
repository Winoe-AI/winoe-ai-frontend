export function getWorkspaceErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const rec = err as Record<string, unknown>;
  if (typeof rec.errorCode === 'string' && rec.errorCode.trim()) {
    return rec.errorCode.trim();
  }
  const details = rec.details;
  if (!details || typeof details !== 'object') return null;
  const detailRecord = details as Record<string, unknown>;
  if (
    typeof detailRecord.errorCode === 'string' &&
    detailRecord.errorCode.trim()
  ) {
    return detailRecord.errorCode.trim();
  }
  if (typeof detailRecord.code === 'string' && detailRecord.code.trim()) {
    return detailRecord.code.trim();
  }
  return null;
}

export function getWorkspaceCodespaceState(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const record = err as Record<string, unknown>;
  if (
    typeof record.codespaceState === 'string' &&
    record.codespaceState.trim()
  ) {
    return record.codespaceState.trim();
  }
  const details = record.details;
  if (!details || typeof details !== 'object') return null;
  const detailRecord = details as Record<string, unknown>;
  if (
    typeof detailRecord.codespaceState === 'string' &&
    detailRecord.codespaceState.trim()
  ) {
    return detailRecord.codespaceState.trim();
  }
  if (
    typeof detailRecord.codespace_status === 'string' &&
    detailRecord.codespace_status.trim()
  ) {
    return detailRecord.codespace_status.trim();
  }
  return null;
}
