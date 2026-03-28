import { screen } from '@testing-library/react';
import {
  initMock,
  renderWorkspacePanel,
  resetWorkspacePanelMocks,
  statusMock,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel ready states', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('renders codespace CTA when available', async () => {
    statusMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });
    renderWorkspacePanel(12, 34);

    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(statusMock).toHaveBeenCalledWith({
      taskId: 12,
      candidateSessionId: 34,
    });
    expect(initMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: /open codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(screen.queryByRole('link', { name: /open repo/i })).toBeNull();
  });

  it('renders repo CTA when codespace is unavailable', async () => {
    statusMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: null,
    });
    renderWorkspacePanel(13, 14);
    await screen.findByText(/Repository is ready/i);
    expect(initMock).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /open repo/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo',
    );
  });

  it('initializes when status is empty or returns 404', async () => {
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
    renderWorkspacePanel(7, 8);
    await screen.findByText(/Repository is ready/i);
    expect(initMock).toHaveBeenCalledTimes(1);

    resetWorkspacePanelMocks();
    statusMock.mockRejectedValueOnce({ status: 404 });
    initMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: null,
    });
    renderWorkspacePanel(5, 6);
    await screen.findByText(/Repository is ready/i);
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it('renders repoFullName when available', async () => {
    statusMock.mockResolvedValueOnce({
      repoUrl: 'https://github.com/org/fullname',
      repoName: 'shortname',
      repoFullName: 'org/fullname',
      codespaceUrl: null,
    });
    renderWorkspacePanel(27, 28);
    expect(await screen.findByText(/Repo: org\/fullname/i)).toBeInTheDocument();
  });
});
