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

describe('WorkspacePanel codespace fallback guidance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetWorkspacePanelMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders codespace wait guidance after fallback retry', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
        codespaceState: 'UNAVAILABLE',
      });
    initWorkspaceMock.mockResolvedValue({
      repoName: 'acme/repo',
      repoFullName: 'acme/repo',
      codespaceUrl: null,
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPanel({ taskId: 9, candidateSessionId: 10 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(
      await screen.findByRole('heading', {
        name: /Shared Codespace still starting/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Codespace access is required for Day 2 and Day 3/i),
    ).toBeInTheDocument();
  });

  it('keeps wait guidance visible when fallback retry fails again', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockRejectedValueOnce(
        Object.assign(new Error('status failed again'), { status: 500 }),
      );
    initWorkspaceMock.mockResolvedValue({
      repoName: 'acme/repo',
      repoFullName: 'acme/repo',
      codespaceUrl: null,
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPanel({ taskId: 11, candidateSessionId: 12 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(
      await screen.findByRole('heading', {
        name: /Shared Codespace still starting/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Codespace access is required for Day 2 and Day 3/i),
    ).toBeInTheDocument();
  });

  it.each([2, 3])(
    'renders integrity sentence for day %s workspace panel',
    async (dayIndex) => {
      getStatusMock.mockResolvedValueOnce({
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });
      renderPanel({
        taskId: 20 + dayIndex,
        candidateSessionId: 30 + dayIndex,
        dayIndex,
      });
      await screen.findByText(/Workspace is ready/i);
      expect(
        screen.getByText(
          /Only commits pushed to the official repo before cutoff are evaluated\./i,
        ),
      ).toBeInTheDocument();
    },
  );
});
