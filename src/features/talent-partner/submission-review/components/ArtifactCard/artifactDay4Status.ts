export function normalizeHandoffStatus(
  status: string | null | undefined,
): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

export function isTranscriptReady(status: string | null | undefined): boolean {
  const normalized = normalizeHandoffStatus(status);
  return (
    normalized === 'ready' ||
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'done' ||
    normalized === 'succeeded' ||
    normalized === 'success'
  );
}

export function isTranscriptProcessing(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeHandoffStatus(status);
  return (
    normalized === 'processing' ||
    normalized === 'queued' ||
    normalized === 'pending' ||
    normalized === 'running' ||
    normalized === 'in_progress' ||
    normalized === 'transcribing'
  );
}

export function isTranscriptFailed(status: string | null | undefined): boolean {
  const normalized = normalizeHandoffStatus(status);
  return (
    normalized === 'failed' ||
    normalized === 'error' ||
    normalized === 'errored' ||
    normalized === 'rejected' ||
    normalized === 'canceled' ||
    normalized === 'cancelled' ||
    normalized === 'aborted'
  );
}
