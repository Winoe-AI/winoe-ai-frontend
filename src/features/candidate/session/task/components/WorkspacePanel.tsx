'use client';
import { useWorkspaceStatus } from '../hooks/useWorkspaceStatus';
import { buildWorkspaceMessage } from '../utils/workspaceMessages';
import { WorkspacePanelHeader } from './WorkspacePanelHeader';
import { WorkspacePanelBody } from './WorkspacePanelBody';

type WorkspacePanelProps = {
  taskId: number;
  candidateSessionId: number;
  dayIndex: number;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function WorkspacePanel(props: WorkspacePanelProps) {
  const {
    dayIndex,
    taskId,
    candidateSessionId,
    readOnly = false,
    readOnlyReason = null,
    onTaskWindowClosed,
  } = props;
  const { workspace, loading, refreshing, error, notice, refresh } =
    useWorkspaceStatus({
      taskId,
      candidateSessionId,
      enabled: !readOnly,
      onTaskWindowClosed,
    });

  const workspaceMessage = buildWorkspaceMessage(workspace);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <WorkspacePanelHeader
        dayIndex={dayIndex}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        readOnly={readOnly}
      />
      <WorkspacePanelBody
        workspace={workspace}
        loading={loading}
        error={error}
        notice={notice}
        refreshing={refreshing}
        onRefresh={refresh}
        message={workspaceMessage}
        readOnly={readOnly}
        readOnlyReason={readOnlyReason}
      />
    </div>
  );
}
