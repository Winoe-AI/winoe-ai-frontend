import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspacePanel } from '@/features/candidate/session/task/components/WorkspacePanel';

const notifyMock = jest.fn();

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));

const getStatusMock = jest.fn();
const initWorkspaceMock = jest.fn();

jest.mock('@/features/candidate/api', () => ({
  getCandidateWorkspaceStatus: (...args: unknown[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: unknown[]) => initWorkspaceMock(...args),
}));

describe('WorkspacePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStatusMock.mockReset();
    initWorkspaceMock.mockReset();
    notifyMock.mockReset();
  });

  const renderPanel = (opts?: Partial<{ dayIndex: number }>) =>
    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={opts?.dayIndex ?? 2}
      />,
    );

  it('renders ready state with repo and codespace links', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/tenon/repo',
      repoName: 'repo',
      codespaceUrl: 'https://codespaces.com/open',
    });
    renderPanel();
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo URL/i })).toHaveAttribute(
      'href',
      'https://github.com/tenon/repo',
    );
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.com/open');
  });

  it('initializes workspace when status 404 and then shows message', async () => {
    const err = Object.assign(new Error('missing'), { status: 404 });
    getStatusMock.mockRejectedValueOnce(err);
    initWorkspaceMock.mockResolvedValue({
      repoUrl: 'http://repo',
      repoName: 'repo',
      codespaceUrl: null,
    });

    renderPanel();
    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalled();
  });

  it('shows provisioning notice on 409 and fires warning notification', async () => {
    const err = Object.assign(new Error('provisioning'), { status: 409 });
    getStatusMock.mockRejectedValueOnce(err);
    renderPanel();
    expect(
      await screen.findByText(/Workspace repo not provisioned yet/i),
    ).toBeInTheDocument();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'warning' }),
    );
  });

  it('keeps workspace-not-initialized guidance clear when backend returns WORKSPACE_NOT_INITIALIZED', async () => {
    const err = Object.assign(new Error('not ready'), {
      status: 422,
      details: { errorCode: 'WORKSPACE_NOT_INITIALIZED' },
    });
    getStatusMock.mockRejectedValueOnce(err);
    renderPanel();
    expect(
      await screen.findByText(/Workspace repo not provisioned yet/i),
    ).toBeInTheDocument();
  });

  it('handles auth expiry by showing session expired error', async () => {
    const err = Object.assign(new Error('auth'), { status: 401 });
    getStatusMock.mockRejectedValueOnce(err);
    renderPanel();
    expect(
      await screen.findByText(/Session expired. Please sign in again./i),
    ).toBeInTheDocument();
  });

  it('refreshes workspace and sends success toast', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'http://repo',
      repoName: 'repo',
      codespaceUrl: 'http://codespace',
    });
    renderPanel();
    await screen.findByText(/Workspace is ready/i);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Refresh/i }));
    expect(getStatusMock).toHaveBeenCalledTimes(2);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Workspace updated' }),
    );
  });

  it('disables refresh when loading or refreshing', async () => {
    // first call pending, second call resolves
    let resolveStatus: (val: unknown) => void;
    getStatusMock.mockReturnValueOnce(
      new Promise((res) => {
        resolveStatus = res;
      }),
    );
    const { getByRole } = renderPanel();
    const refresh = getByRole('button', { name: /Refresh/i });
    expect(refresh).toBeDisabled();
    // finish first fetch
    resolveStatus?.({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    await screen.findByText(/Workspace provisioning is underway/i);
  });

  it('shows provisioning guidance when status is empty', async () => {
    getStatusMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /Refresh/i }));
    await screen.findByText(/Workspace provisioning is underway/i);
  });

  it('reports day-specific workspace snapshots for shared normalization', async () => {
    const onCodingWorkspaceSnapshot = jest.fn();
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/shared',
      repoName: 'acme/shared',
      repoFullName: 'acme/shared',
      codespaceUrl: 'https://codespaces.new/acme/shared',
    });

    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={2}
        onCodingWorkspaceSnapshot={onCodingWorkspaceSnapshot}
      />,
    );

    await screen.findByText(/Workspace is ready/i);
    expect(onCodingWorkspaceSnapshot).toHaveBeenCalledWith({
      dayIndex: 2,
      workspace: expect.objectContaining({
        repoFullName: 'acme/shared',
        codespaceUrl: 'https://codespaces.new/acme/shared',
      }),
    });
  });

  it('renders shared coding workspace header', async () => {
    getStatusMock.mockResolvedValue(null);
    renderPanel({ dayIndex: 3 });
    expect(await screen.findByText(/Coding workspace/i)).toBeInTheDocument();
  });

  it('keeps workspace panel read-only while still showing pre-cutoff integrity rules', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });

    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={2}
        readOnly
        readOnlyReason="Day closed for this task."
      />,
    );

    expect(screen.getByText(/Coding workspace/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Workspace actions are paused/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Day closed for this task/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Work after cutoff will not be considered/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
    expect(screen.queryByText(/Cutoff commit:/i)).toBeNull();
    expect(screen.queryByText(/Cutoff time:/i)).toBeNull();
    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
    expect(getStatusMock).toHaveBeenCalledTimes(1);
    expect(initWorkspaceMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('link', { name: /Open Codespace/i }),
    ).not.toBeInTheDocument();
  });

  it('shows cutoff commit and evaluation basis details when day is closed after cutoff', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });

    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={2}
        readOnly
        readOnlyReason="Day closed. Work after cutoff will not be considered."
        cutoffCommitSha="abc123def456"
        cutoffAt="2026-03-08T17:45:00.000Z"
        isClosed
      />,
    );

    expect(await screen.findByText(/^Day closed$/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Evaluation is based on the commit shown below/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abc123def456/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/commit/abc123def456',
    );
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Day closed\. Work after cutoff will not be considered\./i,
      ),
    ).toBeInTheDocument();
    expect(getStatusMock).toHaveBeenCalledTimes(1);
  });

  it('loads cutoff fields from workspace status when read-only closed panels receive no cutoff props', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });

    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={2}
        readOnly
        readOnlyReason="Day closed. Work after cutoff will not be considered."
        isClosed
      />,
    );

    expect(await screen.findByText(/^Day closed$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Evaluation is based on the commit shown below/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abc123def456/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/commit/abc123def456',
    );
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
    expect(getStatusMock).toHaveBeenCalledTimes(1);
  });

  it('keeps shared workspace identity when moving from Day 2 to Day 3', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/local/day2-only',
        repoName: 'day2-only',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/local/day3-only',
        repoName: 'day3-only',
        codespaceUrl: null,
      });

    const sharedWorkspace = {
      repoFullName: 'acme/unified-workspace',
      repoName: 'acme/unified-workspace',
      repoUrl: 'https://github.com/acme/unified-workspace',
      codespaceUrl: 'https://codespaces.new/acme/unified-workspace',
      isInitialized: true,
      error: null,
    };

    const { rerender } = render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={2}
        codingWorkspace={sharedWorkspace}
      />,
    );

    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo URL/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/unified-workspace',
    );
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');

    rerender(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={3}
        codingWorkspace={sharedWorkspace}
      />,
    );

    expect(
      screen.getByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo URL/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/unified-workspace',
    );
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');
  });

  it('renders explicit inconsistency error when day identities conflict', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/day3',
      repoName: 'acme/day3',
      codespaceUrl: 'https://codespaces.new/acme/day3',
    });

    render(
      <WorkspacePanel
        taskId={1}
        candidateSessionId={2}
        dayIndex={3}
        codingWorkspace={{
          repoFullName: null,
          repoName: null,
          repoUrl: null,
          codespaceUrl: null,
          isInitialized: false,
          error:
            'Workspace mismatch detected between Day 2 and Day 3. Refresh and contact support if this continues.',
        }}
      />,
    );

    expect(
      await screen.findByText(
        /Workspace mismatch detected between Day 2 and Day 3/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Repo URL/i })).toBeNull();
  });
});
