import { render } from '@testing-library/react';
import { WorkspacePanel } from '@/features/candidate/tasks/components/WorkspacePanel';

export const notifyMock = jest.fn();
export const getStatusMock = jest.fn();
export const initWorkspaceMock = jest.fn();

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));
jest.mock('@/features/candidate/session/api', () => ({
  getCandidateWorkspaceStatus: (...args: unknown[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: unknown[]) => initWorkspaceMock(...args),
}));

export function resetWorkspacePanelExtraMocks() {
  jest.useRealTimers();
  notifyMock.mockReset();
  getStatusMock.mockReset();
  initWorkspaceMock.mockReset();
}

export function renderPanel(opts?: Partial<{ dayIndex: number }>) {
  return render(
    <WorkspacePanel
      taskId={1}
      candidateSessionId={2}
      dayIndex={opts?.dayIndex ?? 2}
      githubUsername="octocat"
    />,
  );
}
