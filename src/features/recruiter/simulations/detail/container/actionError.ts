export function buildActionError(
  message: string | null | undefined,
  fallback: string,
): string {
  const safe = typeof message === 'string' ? message.trim() : '';
  return safe || fallback;
}
