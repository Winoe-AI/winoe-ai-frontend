import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import { trimOrNull } from './codingWorkspace.normalizeUtils';

export function isWorkspaceInitialized(
  workspace: CandidateWorkspaceStatus | null,
): boolean {
  if (!workspace) return false;
  return Boolean(
    trimOrNull(workspace.repoFullName) ||
    trimOrNull(workspace.repoName) ||
    trimOrNull(workspace.repoUrl) ||
    trimOrNull(workspace.codespaceUrl),
  );
}

export function mergeWorkspaceStatus(
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
