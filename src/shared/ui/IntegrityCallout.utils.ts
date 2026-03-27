function parseGithubRepoSlug(repoUrl: string): string | null {
  try {
    const parsed = new URL(repoUrl);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') return null;

    const parts = parsed.pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;

    const owner = decodeURIComponent(parts[0]);
    const rawRepo = decodeURIComponent(parts[1]);
    const repo = rawRepo.endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo;
    if (!owner || !repo) return null;
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

export function toTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildGithubCommitUrl(
  repoUrl: string | null | undefined,
  commitSha: string | null | undefined,
): string | null {
  const cleanRepoUrl = toTrimmedString(repoUrl);
  const cleanCommitSha = toTrimmedString(commitSha);
  if (!cleanRepoUrl || !cleanCommitSha) return null;

  const slug = parseGithubRepoSlug(cleanRepoUrl);
  if (!slug) return null;
  return `https://github.com/${slug}/commit/${encodeURIComponent(cleanCommitSha)}`;
}
