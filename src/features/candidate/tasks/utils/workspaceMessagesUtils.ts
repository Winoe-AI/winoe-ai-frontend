import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';

export function buildWorkspaceMessage(
  workspace: CandidateWorkspaceStatus | null,
): string {
  const repoReady = Boolean(workspace?.repoFullName || workspace?.repoName);
  const codespaceReady = Boolean(workspace?.codespaceUrl);

  if (!repoReady && !codespaceReady) {
    return 'Your GitHub Codespace is provisioning.';
  }
  if (repoReady && !codespaceReady) {
    return 'Repository is ready. Waiting for the GitHub Codespace link.';
  }
  if (repoReady && codespaceReady) {
    return 'GitHub Codespace ready.';
  }
  return 'Codespace status is updating.';
}
