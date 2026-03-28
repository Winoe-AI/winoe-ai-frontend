import { render } from '@testing-library/react';
import { WorkspacePanel } from '@/features/candidate/tasks/components/WorkspacePanel';
import {
  getCandidateWorkspaceStatus,
  initCandidateWorkspace,
} from '@/features/candidate/session/api';

jest.mock('@/features/candidate/session/api', () => ({
  initCandidateWorkspace: jest.fn(),
  getCandidateWorkspaceStatus: jest.fn(),
}));

export const initMock = initCandidateWorkspace as jest.Mock;
export const statusMock = getCandidateWorkspaceStatus as jest.Mock;

export function resetWorkspacePanelMocks() {
  initMock.mockReset();
  statusMock.mockReset();
}

export function renderWorkspacePanel(
  taskId: number,
  candidateSessionId: number,
  dayIndex = 2,
) {
  return render(
    <WorkspacePanel
      taskId={taskId}
      candidateSessionId={candidateSessionId}
      dayIndex={dayIndex}
    />,
  );
}
