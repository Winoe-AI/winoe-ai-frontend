import React from 'react';
import { act, render } from '@testing-library/react';
import { WorkspacePanel } from '@/features/candidate/session/task/components/WorkspacePanel';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  CODESPACE_NOT_READY_POLL_INTERVAL_MS,
} from '@/features/candidate/session/task/utils/codespaceAvailability';

export const notifyMock = jest.fn();
export const getStatusMock = jest.fn();
export const initWorkspaceMock = jest.fn();

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));

jest.mock('@/features/candidate/api', () => ({
  getCandidateWorkspaceStatus: (...args: any[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: any[]) => initWorkspaceMock(...args),
}));

export const resetWorkspacePanelMocks = () => {
  jest.clearAllMocks();
  getStatusMock.mockReset();
  initWorkspaceMock.mockReset();
  notifyMock.mockReset();
};

export const renderPanel = (props?: Partial<React.ComponentProps<typeof WorkspacePanel>>) =>
  render(
    <WorkspacePanel
      taskId={1}
      candidateSessionId={2}
      dayIndex={2}
      {...props}
    />,
  );

export async function advancePollCycles(cycles: number) {
  for (let i = 0; i < cycles; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(CODESPACE_NOT_READY_POLL_INTERVAL_MS);
    });
    await act(async () => {
      await Promise.resolve();
    });
  }
}

export { CODESPACE_NOT_READY_MAX_POLLS };
