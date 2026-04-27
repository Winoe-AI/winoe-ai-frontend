import { render, screen } from '@testing-library/react';
import { WorkspaceAndTests } from '@/features/candidate/session/views/WorkspaceAndTests';

const getStatusMock = jest.fn();
const initWorkspaceMock = jest.fn();
const mockResolveNowMs = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  getCandidateWorkspaceStatus: (...args: unknown[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: unknown[]) => initWorkspaceMock(...args),
}));

jest.mock('@/shared/time/now', () => ({
  resolveNowMs: () => mockResolveNowMs(),
}));

describe('WorkspaceAndTests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveNowMs.mockReturnValue(Date.parse('2026-03-08T12:00:00.000Z'));
    getStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });
  });

  it('keeps the workspace open before cutoff time even when cutoff metadata exists', async () => {
    render(
      <WorkspaceAndTests
        task={{
          id: 12,
          dayIndex: 2,
          type: 'code',
          title: 'Implement feature',
          description: 'Do the task',
          cutoffCommitSha: 'abc123def456',
          cutoffAt: '2026-03-08T17:45:00.000Z',
        }}
        candidateSessionId={45}
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onStartTests={async () => ({ runId: 'run-1' })}
        onPollTests={async () => ({
          status: 'running',
          passed: null,
          failed: null,
          total: null,
          stdout: null,
          stderr: null,
          workflowUrl: null,
          commitSha: null,
        })}
        onTaskWindowClosed={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^Run tests$/i })).toBeEnabled();
    expect(
      await screen.findByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
    expect(
      screen.getByText(
        /The official Trial repository and its Codespace are the source of truth\. Only commits pushed before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Cutoff commit SHA abc123def456/i));
    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
  });

  it('switches to read-only after the cutoff time passes', async () => {
    mockResolveNowMs.mockReturnValue(Date.parse('2026-03-08T18:00:00.000Z'));

    render(
      <WorkspaceAndTests
        task={{
          id: 12,
          dayIndex: 2,
          type: 'code',
          title: 'Implement feature',
          description: 'Do the task',
          cutoffCommitSha: 'abc123def456',
          cutoffAt: '2026-03-08T17:45:00.000Z',
        }}
        candidateSessionId={45}
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onStartTests={async () => ({ runId: 'run-1' })}
        onPollTests={async () => ({
          status: 'running',
          passed: null,
          failed: null,
          total: null,
          stdout: null,
          stderr: null,
          workflowUrl: null,
          commitSha: null,
        })}
        onTaskWindowClosed={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Run tests unavailable/i }),
    ).toBeDisabled();
    expect(await screen.findByText(/^Day closed$/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Day closed\. The Codespace is read-only after cutoff\./i,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/repo');
  });
});
