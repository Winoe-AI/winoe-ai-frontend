import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import type { CodingWorkspace } from '../utils/codingWorkspaceUtils';

export function resolveSharedWorkspace(
  codingWorkspace: CodingWorkspace | null,
): CandidateWorkspaceStatus | null {
  if (
    !codingWorkspace ||
    !codingWorkspace.isInitialized ||
    codingWorkspace.error
  ) {
    return null;
  }
  return {
    repoFullName: codingWorkspace.repoFullName,
    repoName: codingWorkspace.repoName,
    repoUrl: codingWorkspace.repoUrl,
    codespaceUrl: codingWorkspace.codespaceUrl,
  };
}
