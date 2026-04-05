export function trimOrNull(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function fallbackSummary(errorState: string | null): string {
  if (!errorState) {
    return 'Codespaces is still not ready. Keep this page open and retry in a moment.';
  }
  const normalized = errorState.trim().toLowerCase();
  if (normalized.includes('unavailable')) {
    return 'Codespaces is currently unavailable for this task. Retry in a moment or contact support if this continues.';
  }
  if (normalized.includes('error')) {
    return 'Codespaces could not be initialized right now. Retry in a moment.';
  }
  return 'Codespaces is still not ready. Keep this page open and retry in a moment.';
}
