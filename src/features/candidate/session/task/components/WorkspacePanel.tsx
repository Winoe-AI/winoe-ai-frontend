'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CandidateWorkspaceStatus } from '@/features/candidate/api';
import { IntegrityCallout } from '@/shared/ui/IntegrityCallout';
import { useWorkspaceStatus } from '../hooks/useWorkspaceStatus';
import { buildWorkspaceMessage } from '../utils/workspaceMessages';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '../utils/codingWorkspace';
import { WorkspacePanelHeader } from './WorkspacePanelHeader';
import { WorkspacePanelBody } from './WorkspacePanelBody';

type WorkspacePanelProps = {
  taskId: number;
  candidateSessionId: number;
  dayIndex: number;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  codingWorkspace?: CodingWorkspace | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  isClosed?: boolean;
  integrityCallout?: ReactNode;
  onTaskWindowClosed?: (err: unknown) => void;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};

export function WorkspacePanel(props: WorkspacePanelProps) {
  const {
    dayIndex,
    taskId,
    candidateSessionId,
    readOnly = false,
    readOnlyReason = null,
    codingWorkspace = null,
    cutoffCommitSha = null,
    cutoffAt = null,
    isClosed = false,
    integrityCallout,
    onTaskWindowClosed,
    onCodingWorkspaceSnapshot,
  } = props;
  const hasCutoffProps = Boolean(cutoffCommitSha || cutoffAt);
  const isWorkspaceIntegrityDay = dayIndex === 2 || dayIndex === 3;
  const shouldLoadWorkspace =
    !readOnly || isClosed || hasCutoffProps || isWorkspaceIntegrityDay;
  const { workspace, loading, refreshing, error, notice, refresh } =
    useWorkspaceStatus({
      taskId,
      candidateSessionId,
      enabled: shouldLoadWorkspace,
      onTaskWindowClosed,
    });
  const lastSnapshotKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onCodingWorkspaceSnapshot) return;
    if (dayIndex !== 2 && dayIndex !== 3) return;
    if (loading || error) return;
    const snapshotWorkspace: CandidateWorkspaceStatus | null =
      workspace ?? null;
    const snapshotKey = [
      dayIndex,
      snapshotWorkspace?.repoFullName ?? '',
      snapshotWorkspace?.repoName ?? '',
      snapshotWorkspace?.repoUrl ?? '',
      snapshotWorkspace?.codespaceUrl ?? '',
    ].join('|');
    if (lastSnapshotKeyRef.current === snapshotKey) return;
    lastSnapshotKeyRef.current = snapshotKey;
    onCodingWorkspaceSnapshot({
      dayIndex,
      workspace: snapshotWorkspace,
    });
  }, [dayIndex, error, loading, onCodingWorkspaceSnapshot, workspace]);

  const sharedWorkspace =
    codingWorkspace && codingWorkspace.isInitialized && !codingWorkspace.error
      ? {
          repoFullName: codingWorkspace.repoFullName,
          repoName: codingWorkspace.repoName,
          repoUrl: codingWorkspace.repoUrl,
          codespaceUrl: codingWorkspace.codespaceUrl,
        }
      : null;
  const effectiveWorkspace = sharedWorkspace ?? workspace;
  const effectiveCutoffCommitSha =
    cutoffCommitSha ?? workspace?.cutoffCommitSha ?? null;
  const effectiveCutoffAt = cutoffAt ?? workspace?.cutoffAt ?? null;
  const effectiveError = codingWorkspace?.error ?? error;
  const workspaceMessage = codingWorkspace?.error
    ? 'Unable to confirm a shared Day 2/Day 3 workspace identity.'
    : buildWorkspaceMessage(effectiveWorkspace);
  const calloutNode = integrityCallout ?? (
    <IntegrityCallout
      repoUrl={effectiveWorkspace?.repoUrl ?? null}
      codespaceUrl={effectiveWorkspace?.codespaceUrl ?? null}
      cutoffCommitSha={effectiveCutoffCommitSha}
      cutoffAt={effectiveCutoffAt}
      isClosed={isClosed || Boolean(effectiveCutoffCommitSha)}
    />
  );

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <WorkspacePanelHeader
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        readOnly={readOnly}
      />
      <WorkspacePanelBody
        workspace={effectiveWorkspace}
        loading={loading}
        error={effectiveError}
        notice={notice}
        refreshing={refreshing}
        onRefresh={refresh}
        message={workspaceMessage}
        integrityCallout={calloutNode}
        readOnly={readOnly}
        readOnlyReason={readOnlyReason}
      />
    </div>
  );
}
