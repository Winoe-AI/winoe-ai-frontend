import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspacePanel } from '@/features/candidate/session/task/components/WorkspacePanel';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  CODESPACE_NOT_READY_POLL_INTERVAL_MS,
} from '@/features/candidate/session/task/utils/codespaceAvailability';

const notifyMock = jest.fn();
const getStatusMock = jest.fn();
const initWorkspaceMock = jest.fn();

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));

jest.mock('@/features/candidate/api', () => ({
  getCandidateWorkspaceStatus: (...args: unknown[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: unknown[]) => initWorkspaceMock(...args),
}));

async function advancePollCycles(cycles: number) {
  for (let i = 0; i < cycles; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(CODESPACE_NOT_READY_POLL_INTERVAL_MS);
    });
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe('WorkspacePanel codespace fallback behavior', () => {
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    notifyMock.mockReset();
    getStatusMock.mockReset();
    initWorkspaceMock.mockReset();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows non-actionable fallback state when init fails without repo identity', async () => {
    getStatusMock.mockRejectedValueOnce(
      Object.assign(new Error('Codespaces unavailable'), {
        status: 502,
        details: { errorCode: 'CODESPACE_UNAVAILABLE' },
      }),
    );

    render(<WorkspacePanel taskId={1} candidateSessionId={2} dayIndex={2} />);

    expect(
      await screen.findByRole('heading', {
        name: /Codespaces unavailable, repo details still loading/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeNull();
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[candidate:codespace_fallback_shown]',
      expect.objectContaining({
        dayIndex: 2,
        hasRepoUrl: false,
        taskId: 1,
      }),
    );
  });

  it('retries init after init-error fallback and clears fallback once ready', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: null,
        repoName: null,
        repoFullName: null,
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: null,
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
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<WorkspacePanel taskId={2} candidateSessionId={3} dayIndex={2} />);

    expect(
      await screen.findByRole('heading', {
        name: /Codespaces unavailable, repo details still loading/i,
      }),
    ).toBeInTheDocument();
    expect(initWorkspaceMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    expect(initWorkspaceMock).toHaveBeenCalledTimes(2);
    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(
      screen.queryByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole('heading', {
        name: /Codespaces unavailable, repo details still loading/i,
      }),
    ).toBeNull();
  });

  it('shows fallback after not_ready persists through poll threshold', async () => {
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      repoFullName: 'acme/repo',
      codespaceUrl: null,
    });

    render(<WorkspacePanel taskId={3} candidateSessionId={4} dayIndex={2} />);

    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);

    expect(
      await screen.findByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();
  });

  it('does not render clone fallback panel without repoUrl and can render it once repoUrl appears', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: null,
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: null,
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: null,
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
        codespaceState: 'UNAVAILABLE',
      });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<WorkspacePanel taskId={9} candidateSessionId={10} dayIndex={2} />);

    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);

    expect(
      await screen.findByRole('heading', {
        name: /Codespaces unavailable, repo details still loading/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    expect(
      await screen.findByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/https:\/\/github\.com\/acme\/repo/i).length,
    ).toBeGreaterThan(0);
  });

  it('does not show fallback if ready arrives before threshold', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });

    render(<WorkspacePanel taskId={5} candidateSessionId={6} dayIndex={2} />);

    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    await advancePollCycles(1);

    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(
      screen.queryByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeNull();
  });

  it('supports retry from fallback and clears fallback when ready', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<WorkspacePanel taskId={7} candidateSessionId={8} dayIndex={2} />);

    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    expect(
      await screen.findByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(
      screen.queryByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeNull();
  });

  it('keeps fallback clone guidance visible when fallback retry fails again', async () => {
    getStatusMock
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: null,
      })
      .mockRejectedValueOnce(
        Object.assign(new Error('status failed again'), {
          status: 500,
        }),
      );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<WorkspacePanel taskId={11} candidateSessionId={12} dayIndex={2} />);

    expect(await screen.findByText(/Repository is ready/i)).toBeInTheDocument();
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);

    expect(
      await screen.findByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    expect(
      await screen.findByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Clone the repo locally/i).length).toBe(1);
  });

  it.each([2, 3])(
    'renders the exact integrity sentence for day %s workspace panel',
    async (dayIndex) => {
      getStatusMock.mockResolvedValueOnce({
        repoUrl: 'https://github.com/acme/repo',
        repoName: 'acme/repo',
        repoFullName: 'acme/repo',
        codespaceUrl: 'https://codespaces.new/acme/repo',
      });

      render(
        <WorkspacePanel
          taskId={20 + dayIndex}
          candidateSessionId={30 + dayIndex}
          dayIndex={dayIndex}
        />,
      );

      expect(
        await screen.findByText(/Workspace is ready/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
        ),
      ).toBeInTheDocument();
    },
  );
});
