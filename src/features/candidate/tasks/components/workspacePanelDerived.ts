import { buildWorkspaceMessage } from '../utils/workspaceMessagesUtils';
import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import type { CodingWorkspace } from '../utils/codingWorkspaceUtils';

type WorkspacePanelDerivedArgs = {
  dayIndex: number;
  readOnly: boolean;
  codingWorkspace: CodingWorkspace | null;
  workspace: CandidateWorkspaceStatus | null;
  error: string | null;
  showCodespaceFallback: boolean;
  cutoffCommitSha: string | null;
  cutoffAt: string | null;
};

export function deriveWorkspacePanelState({
  dayIndex,
  readOnly,
  codingWorkspace,
  workspace,
  error,
  showCodespaceFallback,
  cutoffCommitSha,
  cutoffAt,
}: WorkspacePanelDerivedArgs) {
  const isWorkspaceIntegrityDay = dayIndex === 2 || dayIndex === 3;
  const effectiveWorkspace = workspace;
  const effectiveCutoffCommitSha =
    cutoffCommitSha ?? workspace?.cutoffCommitSha ?? null;
  const effectiveCutoffAt = cutoffAt ?? workspace?.cutoffAt ?? null;
  const effectiveError = codingWorkspace?.error ?? error;
  const hasWorkspaceIdentity = Boolean(
    (effectiveWorkspace?.repoFullName &&
      effectiveWorkspace.repoFullName.trim()) ||
      (effectiveWorkspace?.repoName && effectiveWorkspace.repoName.trim()),
  );
  const shouldShowFallback = Boolean(
    showCodespaceFallback && isWorkspaceIntegrityDay && !readOnly,
  );
  const shouldShowActionableFallback = shouldShowFallback;
  const shouldShowUnavailableFallbackState =
    shouldShowFallback && !hasWorkspaceIdentity;
  const workspaceMessage = codingWorkspace?.error
    ? 'Unable to confirm a shared Day 2/Day 3 workspace identity.'
    : buildWorkspaceMessage(effectiveWorkspace);

  return {
    isWorkspaceIntegrityDay,
    effectiveWorkspace,
    effectiveCutoffCommitSha,
    effectiveCutoffAt,
    effectiveError,
    hasWorkspaceIdentity,
    shouldShowFallback,
    shouldShowActionableFallback,
    shouldShowUnavailableFallbackState,
    workspaceMessage,
  };
}
