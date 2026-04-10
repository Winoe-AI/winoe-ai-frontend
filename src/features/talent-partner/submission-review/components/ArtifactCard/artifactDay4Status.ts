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
