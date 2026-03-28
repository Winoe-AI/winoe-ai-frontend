import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  initMock,
  renderWorkspacePanel,
  resetWorkspacePanelMocks,
  statusMock,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel refresh and provisioning states', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('refreshes workspace status on demand', async () => {
    const user = userEvent.setup();
    statusMock.mockResolvedValueOnce({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    initMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: null,
    });
    statusMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: null,
    });

    renderWorkspacePanel(9, 10, 3);
    await screen.findByText(/Repository is ready/i);
    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() =>
      expect(statusMock).toHaveBeenCalledWith({
        taskId: 9,
        candidateSessionId: 10,
      }),
    );
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it('shows provisioning messages when workspace is not ready', async () => {
    statusMock.mockRejectedValueOnce({
      status: 409,
      message: 'Workspace repo not provisioned yet. Please try again.',
    });
    renderWorkspacePanel(15, 16);
    expect(
      await screen.findByText(/Workspace repo not provisioned yet/i),
    ).toBeInTheDocument();

    resetWorkspacePanelMocks();
    statusMock.mockResolvedValueOnce({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    initMock.mockResolvedValueOnce({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    renderWorkspacePanel(17, 18);
    expect(
      await screen.findByText(/Workspace provisioning is underway/i),
    ).toBeInTheDocument();
  });

  it('does not double initialize after a 404 init attempt', async () => {
    statusMock.mockRejectedValueOnce({ status: 404 });
    initMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: null,
    });
    statusMock.mockRejectedValueOnce({ status: 404 });

    renderWorkspacePanel(25, 26);
    await screen.findByText(/Repository is ready/i);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(statusMock).toHaveBeenCalledTimes(2));
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it('shows codespace pending message when no links are available', async () => {
    statusMock.mockResolvedValueOnce({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    initMock.mockResolvedValueOnce({
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    renderWorkspacePanel(29, 30);
    expect(
      await screen.findByText(/Workspace provisioning is underway/i),
    ).toBeInTheDocument();
  });
});
