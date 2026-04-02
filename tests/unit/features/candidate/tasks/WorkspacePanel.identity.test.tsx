import { screen } from '@testing-library/react';
import {
  getStatusMock,
  renderPanel,
  resetWorkspacePanelMocks,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel shared identity behavior', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('reports day-specific workspace snapshots for shared normalization', async () => {
    const onCodingWorkspaceSnapshot = jest.fn();
    getStatusMock.mockResolvedValue({
      repoName: 'acme/shared',
      repoFullName: 'acme/shared',
      codespaceUrl: 'https://codespaces.new/acme/shared',
    });
    renderPanel({ onCodingWorkspaceSnapshot });
    await screen.findByText(/Workspace is ready/i);
    expect(onCodingWorkspaceSnapshot).toHaveBeenCalledWith({
      dayIndex: 2,
      workspace: expect.objectContaining({ repoFullName: 'acme/shared' }),
    });
  });

  it('keeps shared workspace identity across day transitions', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'day2-only',
      codespaceUrl: null,
    });
    const sharedWorkspace = {
      repoFullName: 'acme/unified-workspace',
      repoName: 'acme/unified-workspace',
      codespaceUrl: 'https://codespaces.new/acme/unified-workspace',
      isInitialized: true,
      error: null,
    };
    const { unmount } = renderPanel({
      dayIndex: 2,
      codingWorkspace: sharedWorkspace,
    });
    expect(
      await screen.findByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();

    unmount();
    renderPanel({ dayIndex: 3, codingWorkspace: sharedWorkspace });
    expect(
      await screen.findByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
  });

  it('renders explicit inconsistency error when day identities conflict', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'acme/day3',
      codespaceUrl: 'https://codespaces.new/acme/day3',
    });
    renderPanel({
      dayIndex: 3,
      codingWorkspace: {
        repoFullName: null,
        repoName: null,
        codespaceUrl: null,
        isInitialized: false,
        error:
          'Workspace mismatch detected between Day 2 and Day 3. Refresh and contact support if this continues.',
      },
    });
    expect(
      await screen.findByText(
        /Workspace mismatch detected between Day 2 and Day 3/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
