import type { CandidateWorkspaceStatus } from '@/features/candidate/api';

export type CodingWorkspaceDay = 2 | 3;

export type CodingWorkspaceSnapshot = {
  dayIndex: CodingWorkspaceDay;
  workspace: CandidateWorkspaceStatus | null;
};

export type CodingWorkspace = {
  repoFullName: string | null;
  repoName: string | null;
  repoUrl: string | null;
  codespaceUrl: string | null;
  isInitialized: boolean;
  error: string | null;
};

type Params = {
  day2Workspace: CandidateWorkspaceStatus | null;
  day3Workspace: CandidateWorkspaceStatus | null;
};

function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRepoFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') return null;
    const parts = parsed.pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeRepoName(
  workspace: CandidateWorkspaceStatus | null,
): string | null {
  if (!workspace) return null;
  const fromFullName = trimOrNull(workspace.repoFullName);
  if (fromFullName && fromFullName.includes('/'))
    return fromFullName.toLowerCase();

  const fromRepoUrl = normalizeRepoFromUrl(trimOrNull(workspace.repoUrl));
  if (fromRepoUrl) return fromRepoUrl;

  const fromRepoName = trimOrNull(workspace.repoName);
  if (fromRepoName && fromRepoName.includes('/'))
    return fromRepoName.toLowerCase();

  return null;
}

function normalizeCodespaceKey(url: string | null): string | null {
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

function isInitialized(workspace: CandidateWorkspaceStatus | null): boolean {
  if (!workspace) return false;
  return Boolean(
    trimOrNull(workspace.repoFullName) ||
    trimOrNull(workspace.repoName) ||
    trimOrNull(workspace.repoUrl) ||
    trimOrNull(workspace.codespaceUrl),
  );
}

function mergeWorkspace(
  day2Workspace: CandidateWorkspaceStatus | null,
  day3Workspace: CandidateWorkspaceStatus | null,
): CandidateWorkspaceStatus | null {
  if (!day2Workspace && !day3Workspace) return null;
  const primary = day2Workspace ?? day3Workspace;
  const secondary = day2Workspace ? day3Workspace : null;
  if (!primary) return null;

  return {
    repoFullName:
      trimOrNull(primary.repoFullName) ??
      trimOrNull(secondary?.repoFullName) ??
      null,
    repoName:
      trimOrNull(primary.repoName) ?? trimOrNull(secondary?.repoName) ?? null,
    repoUrl:
      trimOrNull(primary.repoUrl) ?? trimOrNull(secondary?.repoUrl) ?? null,
    codespaceUrl:
      trimOrNull(primary.codespaceUrl) ??
      trimOrNull(secondary?.codespaceUrl) ??
      null,
  };
}

export function areWorkspaceStatusesEqual(
  left: CandidateWorkspaceStatus | null,
  right: CandidateWorkspaceStatus | null,
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return (
    trimOrNull(left.repoFullName) === trimOrNull(right.repoFullName) &&
    trimOrNull(left.repoName) === trimOrNull(right.repoName) &&
    trimOrNull(left.repoUrl) === trimOrNull(right.repoUrl) &&
    trimOrNull(left.codespaceUrl) === trimOrNull(right.codespaceUrl)
  );
}

export function getCodingWorkspace({
  day2Workspace,
  day3Workspace,
}: Params): CodingWorkspace {
  const day2Repo = normalizeRepoName(day2Workspace);
  const day3Repo = normalizeRepoName(day3Workspace);
  const day2Codespace = normalizeCodespaceKey(
    day2Workspace?.codespaceUrl ?? null,
  );
  const day3Codespace = normalizeCodespaceKey(
    day3Workspace?.codespaceUrl ?? null,
  );

  const repoConflict = Boolean(day2Repo && day3Repo && day2Repo !== day3Repo);
  const codespaceConflict = Boolean(
    day2Codespace && day3Codespace && day2Codespace !== day3Codespace,
  );

  if (repoConflict || codespaceConflict) {
    return {
      repoFullName: null,
      repoName: null,
      repoUrl: null,
      codespaceUrl: null,
      isInitialized: false,
      error:
        'Workspace mismatch detected between Day 2 and Day 3. Refresh and contact support if this continues.',
    };
  }

  const merged = mergeWorkspace(day2Workspace, day3Workspace);

  return {
    repoFullName: trimOrNull(merged?.repoFullName) ?? null,
    repoName: trimOrNull(merged?.repoName) ?? null,
    repoUrl: trimOrNull(merged?.repoUrl) ?? null,
    codespaceUrl: trimOrNull(merged?.codespaceUrl) ?? null,
    isInitialized: isInitialized(merged),
    error: null,
  };
}
