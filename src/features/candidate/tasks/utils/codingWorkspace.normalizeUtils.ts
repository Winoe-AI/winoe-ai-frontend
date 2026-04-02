import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';

export function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeRepoName(
  workspace: CandidateWorkspaceStatus | null,
): string | null {
  if (!workspace) return null;
  const fromFullName = trimOrNull(workspace.repoFullName);
  if (fromFullName && fromFullName.includes('/'))
    return fromFullName.toLowerCase();
  const fromRepoName = trimOrNull(workspace.repoName);
  if (fromRepoName && fromRepoName.includes('/'))
    return fromRepoName.toLowerCase();
  return null;
}

export function normalizeCodespaceKey(url: string | null): string | null {
  const clean = trimOrNull(url);
  if (!clean) return null;
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    if (host === 'codespaces.new') {
      const parts = parsed.pathname
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length >= 2)
        return `repo:${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
    }
    if (
      (host === 'github.com' || host === 'www.github.com') &&
      parsed.pathname.toLowerCase().startsWith('/codespaces/new')
    ) {
      const repo = trimOrNull(parsed.searchParams.get('repo'));
      if (repo && repo.includes('/')) return `repo:${repo.toLowerCase()}`;
    }
    return `url:${parsed.origin.toLowerCase()}${parsed.pathname.toLowerCase()}`;
  } catch {
    return `raw:${clean.toLowerCase()}`;
  }
}
