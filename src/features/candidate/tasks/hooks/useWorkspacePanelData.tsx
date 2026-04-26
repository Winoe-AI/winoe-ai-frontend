'use client';
import { IntegrityCallout } from '@/shared/ui/IntegrityCallout';
import { useWorkspaceStatus } from './useWorkspaceStatus';
import { WorkspaceFallbackPanelContent } from '../components/WorkspaceFallbackPanelContent';
import type { WorkspacePanelProps } from '../components/WorkspacePanel.types';
import { deriveWorkspacePanelState } from '../components/workspacePanelDerived';
import { resolveSharedWorkspace } from '../components/workspacePanelSharedWorkspace';
import { useWorkspaceFallbackLogging } from '../components/useWorkspaceFallbackLogging';
import { useWorkspaceSnapshotSync } from '../components/useWorkspaceSnapshotSync';
import { isPastTaskCutoff } from '../utils/taskCutoffUtils';

export function useWorkspacePanelData(props: WorkspacePanelProps) {
  const readOnly = props.readOnly ?? false;
  const hasCutoffProps = Boolean(props.cutoffCommitSha || props.cutoffAt);
  const cutoffClosed = isPastTaskCutoff(props.cutoffAt);
  const isWorkspaceIntegrityDay = props.dayIndex === 2 || props.dayIndex === 3;
  const shouldLoadWorkspace =
    !readOnly || props.isClosed || hasCutoffProps || isWorkspaceIntegrityDay;
  const status = useWorkspaceStatus({
    taskId: props.taskId,
    candidateSessionId: props.candidateSessionId,
    enabled: shouldLoadWorkspace,
    enableCodespaceFallback: isWorkspaceIntegrityDay && !readOnly,
    githubUsername: props.githubUsername ?? null,
    onTaskWindowClosed: props.onTaskWindowClosed,
  });

  useWorkspaceSnapshotSync({
    dayIndex: props.dayIndex,
    loading: status.loading,
    error: status.error,
    workspace: status.workspace,
    onCodingWorkspaceSnapshot: props.onCodingWorkspaceSnapshot,
  });

  const sharedWorkspace = resolveSharedWorkspace(props.codingWorkspace ?? null);
  const derived = deriveWorkspacePanelState({
    dayIndex: props.dayIndex,
    readOnly,
    codingWorkspace: props.codingWorkspace ?? null,
    workspace: sharedWorkspace ?? status.workspace,
    error: status.error,
    showCodespaceFallback: status.showCodespaceFallback,
    cutoffCommitSha: props.cutoffCommitSha ?? null,
    cutoffAt: props.cutoffAt ?? null,
  });

  useWorkspaceFallbackLogging({
    shouldShowFallback: derived.shouldShowFallback,
    dayIndex: props.dayIndex,
    taskId: props.taskId,
    codespaceAvailability: status.codespaceAvailability,
    codespaceFallbackReason: status.codespaceFallbackReason,
    hasWorkspaceIdentity: derived.hasWorkspaceIdentity,
  });

  const integrityCallout = props.integrityCallout ?? (
    <IntegrityCallout
      codespaceUrl={derived.effectiveWorkspace?.codespaceUrl ?? null}
      cutoffCommitSha={derived.effectiveCutoffCommitSha}
      cutoffAt={derived.effectiveCutoffAt}
      isClosed={Boolean(props.isClosed) || cutoffClosed}
    />
  );

  const fallbackPanel = (
    <WorkspaceFallbackPanelContent
      shouldShowActionableFallback={derived.shouldShowActionableFallback}
      shouldShowUnavailableFallbackState={
        derived.shouldShowUnavailableFallbackState
      }
      repoFullName={
        derived.effectiveWorkspace?.repoFullName ??
        derived.effectiveWorkspace?.repoName ??
        null
      }
      codespaceFallbackReason={status.codespaceFallbackReason ?? null}
      codespaceAvailability={status.codespaceAvailability ?? null}
      cutoffAt={derived.effectiveCutoffAt}
      loading={status.loading}
      refreshing={status.refreshing}
      onRetry={status.retryCodespace}
    />
  );

  return {
    readOnly,
    loading: status.loading,
    refreshing: status.refreshing,
    notice: status.notice,
    refresh: status.refresh,
    error: derived.effectiveError,
    workspace: derived.effectiveWorkspace,
    workspaceMessage: derived.workspaceMessage,
    fallbackPanel,
    integrityCallout,
  };
}
