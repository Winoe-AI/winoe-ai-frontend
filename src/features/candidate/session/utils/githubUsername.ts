const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

export function normalizeGithubUsername(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidGithubUsername(value: string | null | undefined) {
  const normalized = normalizeGithubUsername(value);
  if (!normalized) return false;
  return normalized.length <= 39 && GITHUB_USERNAME_RE.test(normalized);
}
