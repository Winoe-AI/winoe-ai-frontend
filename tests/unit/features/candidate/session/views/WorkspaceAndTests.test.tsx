import { render, screen } from '@testing-library/react';
import { WorkspaceAndTests } from '@/features/candidate/session/views/WorkspaceAndTests';

const getStatusMock = jest.fn();
const initWorkspaceMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  getCandidateWorkspaceStatus: (...args: unknown[]) => getStatusMock(...args),
  initCandidateWorkspace: (...args: unknown[]) => initWorkspaceMock(...args),
}));

describe('WorkspaceAndTests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStatusMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/repo',
      repoName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
    });
  });

  it('shows closed cutoff state and disables run tests after cutoff commit is recorded', async () => {
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
      screen.getByText(/Evaluation is based on the commit shown below/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abc123def456/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/commit/abc123def456',
    );
    expect(
      screen.getAllByText(
        /Day closed\. Work after cutoff will not be considered\./i,
      ).length,
    ).toBeGreaterThan(0);
  });
});
