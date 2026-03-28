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
      repoUrl: null,
      repoName: null,
      codespaceUrl: null,
    });
    initWorkspaceMock.mockResolvedValue({
      repoUrl: 'http://repo',
      repoName: 'test-repo',
      codespaceUrl: null,
    });
    renderPanel();
    await waitFor(() => expect(initWorkspaceMock).toHaveBeenCalled());
    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
  });

  it('shows repoName only when repoUrl is missing', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: null,
      repoName: 'test-repo-name',
      codespaceUrl: null,
    });
    renderPanel();
    expect(await screen.findByText(/test-repo-name/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Repo URL/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Codespace link will appear when ready/i),
    ).toBeInTheDocument();
  });

  it('shows Open Repo link when only repoUrl is available', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'http://repo',
      repoName: null,
      codespaceUrl: null,
    });
    renderPanel();
    expect(
      await screen.findByRole('link', { name: /Open Repo/i }),
    ).toBeInTheDocument();
  });

  it('uses repoFullName when available', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'http://repo',
      repoName: 'short-name',
      repoFullName: 'org/full-repo-name',
      codespaceUrl: null,
    });
    renderPanel();
    expect(await screen.findByText(/org\/full-repo-name/)).toBeInTheDocument();
  });

  it('shows workspace status updating message when only codespace is available', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: null,
      repoName: null,
      codespaceUrl: 'http://codespace',
    });
    renderPanel();
    expect(
      await screen.findByText(/Workspace status is updating/i),
    ).toBeInTheDocument();
  });
});
