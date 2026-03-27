import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import type { CodingWorkspace } from './codingWorkspace.typesUtils';
import {
  isWorkspaceInitialized,
  mergeWorkspaceStatus,
} from './codingWorkspace.mergeUtils';
import {
  normalizeCodespaceKey,
  normalizeRepoName,
  trimOrNull,
} from './codingWorkspace.normalizeUtils';

type Params = {
  day2Workspace: CandidateWorkspaceStatus | null;
  day3Workspace: CandidateWorkspaceStatus | null;
};

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

  const merged = mergeWorkspaceStatus(day2Workspace, day3Workspace);
  return {
    repoFullName: trimOrNull(merged?.repoFullName) ?? null,
    repoName: trimOrNull(merged?.repoName) ?? null,
    repoUrl: trimOrNull(merged?.repoUrl) ?? null,
    codespaceUrl: trimOrNull(merged?.codespaceUrl) ?? null,
    isInitialized: isWorkspaceInitialized(merged),
    error: null,
  };
}
