import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  advancePollCycles,
  getStatusMock,
  renderPanel,
  resetWorkspacePanelMocks,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel codespace clone guidance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetWorkspacePanelMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders clone guidance once repoUrl appears after fallback retry', async () => {
    getStatusMock.mockResolvedValueOnce({ repoUrl: null, repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockResolvedValueOnce({ repoUrl: null, repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockResolvedValueOnce({ repoUrl: null, repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null, codespaceState: 'UNAVAILABLE' });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPanel({ taskId: 9, candidateSessionId: 10 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(await screen.findByRole('heading', { name: /Continue locally if Codespaces is unavailable/i })).toBeInTheDocument();
    expect(screen.getAllByText(/https:\/\/github\.com\/acme\/repo/i).length).toBeGreaterThan(0);
  });

  it('keeps clone guidance visible when fallback retry fails again', async () => {
    getStatusMock.mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: null }).mockRejectedValueOnce(Object.assign(new Error('status failed again'), { status: 500 }));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPanel({ taskId: 11, candidateSessionId: 12 });
    await screen.findByText(/Repository is ready/i);
    await advancePollCycles(CODESPACE_NOT_READY_MAX_POLLS - 1);
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(await screen.findByRole('heading', { name: /Continue locally if Codespaces is unavailable/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Clone the repo locally/i).length).toBe(1);
  });

  it.each([2, 3])('renders integrity sentence for day %s workspace panel', async (dayIndex) => {
    getStatusMock.mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: 'acme/repo', codespaceUrl: 'https://codespaces.new/acme/repo' });
    renderPanel({ taskId: 20 + dayIndex, candidateSessionId: 30 + dayIndex, dayIndex });
    await screen.findByText(/Workspace is ready/i);
    expect(screen.getByText(/You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i)).toBeInTheDocument();
  });
});
