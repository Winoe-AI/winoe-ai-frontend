function toRepoName(repoFullName: string | null): string {
  if (!repoFullName) return 'repo';
  const parts = repoFullName.split('/').filter(Boolean);
  if (parts.length === 0) return 'repo';
  return parts[parts.length - 1] ?? 'repo';
}

export function trimOrNull(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function fallbackSummary(errorState: string | null): string {
  if (!errorState) {
    return 'Codespaces is still not ready. You can continue locally now and push to the official repo.';
  }
  const normalized = errorState.trim().toLowerCase();
  if (normalized.includes('unavailable')) {
    return 'Codespaces is currently unavailable for this task. Continue locally and push to the official repo.';
  }
  if (normalized.includes('error')) {
    return 'Codespaces could not be initialized right now. Continue locally and push to the official repo.';
  }
  return 'Codespaces is still not ready. You can continue locally now and push to the official repo.';
}

export function buildCommandBlock(
  repoUrl: string | null,
  repoFullName: string | null,
): string {
  const repoName = toRepoName(repoFullName);
  return [
    repoUrl ? `git clone ${repoUrl}` : '# Copy repo URL, then clone',
    `cd ${repoName}`,
    'git checkout -b my-solution',
    '# Run tests locally (follow this repo README)',
    '# Push commits to the official repo before cutoff',
  ].join('\n');
}
