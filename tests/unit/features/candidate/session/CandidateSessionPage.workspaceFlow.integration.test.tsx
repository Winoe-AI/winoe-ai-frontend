import { act, render, screen, waitFor } from '@testing-library/react';
import {
  buildSessionContext,
  buildTask,
  getCandidateWorkspaceStatusMock,
  resetWorkspaceFlowMocks,
  useCandidateSessionMock,
} from './CandidateSessionPage.workspaceFlow.integration.testlib';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';

describe('CandidateSessionPage shared coding workspace flow', () => {
  beforeEach(() => {
    resetWorkspaceFlowMocks();
  });

  it('preserves shared repo and codespace identity from Day 2 to Day 3', async () => {
    const day2Task = buildTask({
      id: 200,
      dayIndex: 2,
      type: 'code',
      title: 'Day 2',
    });
    const day3Task = buildTask({
      id: 300,
      dayIndex: 3,
      type: 'debug',
      title: 'Day 3',
      description: 'Debug and wrap-up',
    });

    getCandidateWorkspaceStatusMock.mockImplementation(
      ({ taskId }: { taskId: number }) => {
        if (taskId === day2Task.id)
          return Promise.resolve({
            repoFullName: 'acme/unified-workspace',
            repoName: 'acme/unified-workspace',
            codespaceUrl: 'https://codespaces.new/acme/unified-workspace',
          });
        if (taskId === day3Task.id)
          return Promise.resolve({
            repoFullName: 'acme/unified-workspace',
            repoName: 'acme/unified-workspace',
            codespaceUrl: null,
          });
        return Promise.resolve(null);
      },
    );

    const sessionContext = buildSessionContext(day2Task);
    useCandidateSessionMock.mockImplementation(() => sessionContext);
    const { rerender } = render(<CandidateSessionPage token="inv" />);

    expect(
      await screen.findByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');

    await act(async () => {
      sessionContext.state = {
        ...sessionContext.state,
        taskState: { ...sessionContext.state.taskState, currentTask: day3Task },
      };
      rerender(<CandidateSessionPage token="inv" />);
    });

    await waitFor(() =>
      expect(getCandidateWorkspaceStatusMock).toHaveBeenCalledWith({
        taskId: 300,
        candidateSessionId: 99,
      }),
    );
    expect(
      screen.getByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');
  });

  it('fails closed when Day 2 and Day 3 workspace snapshots conflict', async () => {
    const day2Task = buildTask({
      id: 210,
      dayIndex: 2,
      type: 'code',
      title: 'Day 2',
    });
    const day3Task = buildTask({
      id: 310,
      dayIndex: 3,
      type: 'debug',
      title: 'Day 3',
      description: 'Debug and wrap-up',
    });

    getCandidateWorkspaceStatusMock.mockImplementation(
      ({ taskId }: { taskId: number }) => {
        if (taskId === day2Task.id)
          return Promise.resolve({
            repoFullName: 'acme/day2',
            repoName: 'acme/day2',
            codespaceUrl: 'https://codespaces.new/acme/day2',
          });
        if (taskId === day3Task.id)
          return Promise.resolve({
            repoFullName: 'acme/day3',
            repoName: 'acme/day3',
            codespaceUrl: 'https://codespaces.new/acme/day3',
          });
        return Promise.resolve(null);
      },
    );

    const sessionContext = buildSessionContext(day2Task);
    useCandidateSessionMock.mockImplementation(() => sessionContext);
    const { rerender } = render(<CandidateSessionPage token="inv" />);
    await screen.findByText(/Repo: acme\/day2/i);

    await act(async () => {
      sessionContext.state = {
        ...sessionContext.state,
        taskState: { ...sessionContext.state.taskState, currentTask: day3Task },
      };
      rerender(<CandidateSessionPage token="inv" />);
    });

    expect(
      await screen.findByText(
        /Workspace mismatch detected between Day 2 and Day 3/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open Codespace/i })).toBeNull();
  });
});
