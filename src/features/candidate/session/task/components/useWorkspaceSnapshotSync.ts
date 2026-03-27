import { useEffect, useRef } from 'react';
import type { CandidateWorkspaceStatus } from '@/features/candidate/api';
import type { CodingWorkspaceSnapshot } from '../utils/codingWorkspace';

type UseWorkspaceSnapshotSyncArgs = {
  dayIndex: number;
  loading: boolean;
  error: string | null;
  workspace: CandidateWorkspaceStatus | null;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};

export function useWorkspaceSnapshotSync({
  dayIndex,
  loading,
  error,
  workspace,
  onCodingWorkspaceSnapshot,
}: UseWorkspaceSnapshotSyncArgs) {
  const lastSnapshotKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onCodingWorkspaceSnapshot) return;
    if (dayIndex !== 2 && dayIndex !== 3) return;
    if (loading || error) return;
    const snapshotWorkspace: CandidateWorkspaceStatus | null = workspace ?? null;
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
}
