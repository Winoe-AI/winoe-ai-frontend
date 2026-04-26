import { screen } from '@testing-library/react';
import {
  getStatusMock,
  initWorkspaceMock,
  renderPanel,
  resetWorkspacePanelMocks,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel read-only and cutoff', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('keeps panel read-only while preserving integrity rules', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });
    renderPanel({
      readOnly: true,
      readOnlyReason: 'Day closed for this task.',
    });
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Workspace actions are paused/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day closed for this task/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(initWorkspaceMock).not.toHaveBeenCalled();
  });

  it('shows cutoff commit and evaluation details when closed', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });
    renderPanel({
      readOnly: true,
      readOnlyReason: 'Day closed. Work after cutoff will not be considered.',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
      isClosed: true,
    });
    expect(await screen.findByText(/^Day closed$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cutoff commit SHA abc123def456/i));
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
  });

  it('loads cutoff fields from status when cutoff props are omitted', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });
    renderPanel({
      readOnly: true,
      readOnlyReason: 'Day closed. Work after cutoff will not be considered.',
      isClosed: true,
    });
    expect(await screen.findByText(/^Day closed$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cutoff commit SHA abc123def456/i));
  });
});
