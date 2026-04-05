import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  getStatusMock,
  initWorkspaceMock,
  notifyMock,
  renderPanel,
  resetWorkspacePanelExtraMocks,
} from './WorkspacePanel.extra.testlib';

describe('WorkspacePanel extra notifications and retry', () => {
  beforeEach(() => {
    resetWorkspacePanelExtraMocks();
  });

  it('handles 403 as session expired', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('forbidden'), { status: 403 }),
    );
    renderPanel();
    expect(
      await screen.findByText(/Session expired. Please sign in again./i),
    ).toBeInTheDocument();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Session expired' }),
    );
  });

  it('handles generic init error with notification', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('server error'), { status: 500 }),
    );
    renderPanel();
    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Workspace not available' }),
      ),
    );
  });

  it('shows Retry button and recovers after retry', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('error'), { status: 500 }),
    );
    renderPanel();
    await screen.findByRole('button', { name: /Retry/i });

    getStatusMock.mockResolvedValueOnce({
      repoName: 'repo',
      codespaceUrl: 'http://codespace',
    });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();
  });

  it('does not re-initialize on second 404 after first attempt', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { status: 404 }),
    );
    initWorkspaceMock.mockResolvedValueOnce({
      repoName: null,
      codespaceUrl: null,
    });
    renderPanel();
    await waitFor(() => expect(initWorkspaceMock).toHaveBeenCalledTimes(1));

    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { status: 404 }),
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => expect(initWorkspaceMock).toHaveBeenCalledTimes(1));
  });

  it('clears initErrorNotified on successful load and notifies again on later failure', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('error'), { status: 500 }),
    );
    renderPanel();
    await waitFor(() => expect(notifyMock).toHaveBeenCalledTimes(1));

    getStatusMock.mockResolvedValueOnce({
      repoName: 'repo',
      codespaceUrl: 'http://codespace',
    });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText(/Workspace is ready/i)).toBeInTheDocument();

    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('error again'), { status: 500 }),
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => expect(notifyMock).toHaveBeenCalledTimes(3));
  });
});
