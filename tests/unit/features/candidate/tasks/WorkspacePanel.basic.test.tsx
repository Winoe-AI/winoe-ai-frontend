import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  getStatusMock,
  initWorkspaceMock,
  notifyMock,
  renderPanel,
  resetWorkspacePanelMocks,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel basic states', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('renders ready state with repo identity and codespace link', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'repo',
      codespaceUrl: 'https://codespaces.com/open',
    });
    renderPanel();
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Repo: repo/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.com/open');
  });

  it('initializes workspace on 404 and shows repository ready', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('missing'), { status: 404 }),
    );
    initWorkspaceMock.mockResolvedValue({
      repoName: 'repo',
      codespaceUrl: null,
    });
    renderPanel();
    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalled();
  });

  it.each([
    [
      Object.assign(new Error('provisioning'), { status: 409 }),
      /Workspace repo not provisioned yet/i,
      'warning',
    ],
    [
      Object.assign(new Error('not ready'), {
        status: 422,
        details: { errorCode: 'WORKSPACE_NOT_INITIALIZED' },
      }),
      /Workspace repo not provisioned yet/i,
      undefined,
    ],
    [
      Object.assign(new Error('auth'), { status: 401 }),
      /Session expired\. Please sign in again\./i,
      undefined,
    ],
  ])('handles status/error variant %#', async (error, message, tone) => {
    getStatusMock.mockRejectedValueOnce(error);
    renderPanel();
    expect(await screen.findByText(message)).toBeInTheDocument();
    if (tone)
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone }),
      );
  });

  it('refreshes workspace and emits success toast', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'repo',
      codespaceUrl: 'http://codespace',
    });
    renderPanel();
    await screen.findByText(/Workspace is ready/i);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Refresh/i }));
    expect(getStatusMock).toHaveBeenCalledTimes(2);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Workspace updated' }),
    );
  });

  it('shows provisioning guidance for empty status response', async () => {
    getStatusMock.mockResolvedValue(undefined);
    renderPanel();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Refresh/i }));
    await screen.findByText(/Workspace provisioning is underway/i);
  });
});
