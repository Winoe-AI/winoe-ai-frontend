'use client';
import { WorkspacePanelBody } from './WorkspacePanelBody';
import { WorkspacePanelHeader } from './WorkspacePanelHeader';
import type { WorkspacePanelProps } from './WorkspacePanel.types';
import { useWorkspacePanelData } from './useWorkspacePanelData';

export function WorkspacePanel(props: WorkspacePanelProps) {
  const panel = useWorkspacePanelData(props);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <WorkspacePanelHeader
        loading={panel.loading}
        refreshing={panel.refreshing}
        onRefresh={panel.refresh}
        readOnly={panel.readOnly}
      />
      <WorkspacePanelBody
        workspace={panel.workspace}
        loading={panel.loading}
        error={panel.error}
        notice={panel.notice}
        refreshing={panel.refreshing}
        onRefresh={panel.refresh}
        message={panel.workspaceMessage}
        integrityCallout={panel.integrityCallout}
        fallbackPanel={panel.fallbackPanel}
        readOnly={panel.readOnly}
        readOnlyReason={props.readOnlyReason ?? null}
      />
    </div>
  );
}
