import type { ReactNode } from 'react';
import type { CodingWorkspace, CodingWorkspaceSnapshot } from '../utils/codingWorkspace';

export type WorkspacePanelProps = {
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
