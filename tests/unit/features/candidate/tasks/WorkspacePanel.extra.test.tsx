import { screen, waitFor } from '@testing-library/react';
import {
  getStatusMock,
  initWorkspaceMock,
  renderPanel,
  resetWorkspacePanelExtraMocks,
} from './WorkspacePanel.extra.testlib';

describe('WorkspacePanel extra rendering', () => {
  beforeEach(() => {
    resetWorkspacePanelExtraMocks();
  });

  it('initializes workspace when status returns empty workspace', async () => {
    getStatusMock.mockResolvedValueOnce({
      repoName: null,
      codespaceUrl: null,
    });
    initWorkspaceMock.mockResolvedValue({
      repoName: 'test-repo',
      codespaceUrl: null,
    });
    renderPanel();
    await waitFor(() => expect(initWorkspaceMock).toHaveBeenCalled());
    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
  });

  it('shows repoName when no Codespace link is available yet', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'test-repo-name',
      codespaceUrl: null,
    });
    initWorkspaceMock.mockResolvedValue({
      repoName: 'test-repo-name',
      codespaceUrl: null,
    });
    renderPanel();
    expect(await screen.findByText(/test-repo-name/)).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('link', { name: /Open Codespace/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Codespace link will appear when ready/i),
    ).toBeInTheDocument();
  });

  it('does not render repo CTA when only repo identity is available', async () => {
    getStatusMock.mockResolvedValue({
      repoFullName: 'org/repo-only',
      repoName: null,
      codespaceUrl: null,
    });
    initWorkspaceMock.mockResolvedValue({
      repoFullName: 'org/repo-only',
      repoName: null,
      codespaceUrl: null,
    });
    renderPanel();
    expect(
      await screen.findByText(/Repo: org\/repo-only/i),
    ).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: /Open Repo/i })).toBeNull();
  });

  it('uses repoFullName when available', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'short-name',
      repoFullName: 'org/full-repo-name',
      codespaceUrl: null,
    });
    initWorkspaceMock.mockResolvedValue({
      repoName: 'short-name',
      repoFullName: 'org/full-repo-name',
      codespaceUrl: null,
    });
    renderPanel();
    expect(await screen.findByText(/org\/full-repo-name/)).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalledTimes(1);
  });

  it('shows workspace status updating message when only codespace is available', async () => {
    getStatusMock.mockResolvedValue({
      repoName: null,
      codespaceUrl: 'http://codespace',
    });
    renderPanel();
    expect(
      await screen.findByText(/Codespace status is updating/i),
    ).toBeInTheDocument();
  });
});
