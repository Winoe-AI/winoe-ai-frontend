import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  advancePollCycles,
  getStatusMock,
  initWorkspaceMock,
  renderPanel,
  resetWorkspacePanelMocks,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel codespace fallback behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetWorkspacePanelMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows non-actionable fallback when init fails without repo identity', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('Codespaces unavailable'), {
        status: 502,
        details: { errorCode: 'CODESPACE_UNAVAILABLE' },
      }),
    );
    renderPanel();
    expect(
      await screen.findByRole('heading', {
        name: /Shared Codespace still starting/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Try again/i }),
    ).toBeInTheDocument();
  });

  it('retries init from fallback and clears fallback once ready', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoName: null,
        repoFullName: null,
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: null,
        repoFullName: null,
        codespaceUrl: null,
      });
    initWorkspaceMock
      .mockRejectedValueOnce(
        Object.assign(new Error('Init failed'), {
          status: 502,
          details: { errorCode: 'CODESPACE_UNAVAILABLE' },
        }),
      )
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPanel({ taskId: 2, candidateSessionId: 3 });
    await screen.findByRole('heading', {
      name: /Shared Codespace still starting/i,
    });
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
  });

  it('shows fallback after not_ready persists through poll threshold', async () => {
    getStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      repoFullName: 'acme/repo',
      codespaceUrl: null,
    });
    renderPanel({ taskId: 3, candidateSessionId: 4 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    expect(
      await screen.findByRole('heading', {
        name: /Shared Codespace still starting/i,
      }),
    ).toBeInTheDocument();
  });

  it('does not show fallback if ready arrives before threshold', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });
    renderPanel({ taskId: 5, candidateSessionId: 6 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(1);
    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
  });
});
