export function normalizeStatusLabel(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function isTranscriptReady(status: string | null | undefined): boolean {
  const normalized = normalizeStatusLabel(status);
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
  const normalized = normalizeStatusLabel(status);
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
  const normalized = normalizeStatusLabel(status);
  return normalized === 'failed' || normalized === 'error';
}

export function isRecordingProcessing(status: string | null | undefined): boolean {
  return normalizeStatusLabel(status) === 'processing';
}

export function isRecordingFailed(status: string | null | undefined): boolean {
  const normalized = normalizeStatusLabel(status);
  return normalized === 'failed' || normalized === 'error';
}
