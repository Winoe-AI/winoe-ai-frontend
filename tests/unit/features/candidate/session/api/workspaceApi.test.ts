import { initCandidateWorkspace } from '@/features/candidate/session/api/workspaceApi';
import { requestWorkspaceStatus } from '@/features/candidate/session/api/workspace.requestApi';

jest.mock('@/features/candidate/session/api/workspace.requestApi', () => ({
  requestWorkspaceStatus: jest.fn(),
}));

const requestWorkspaceStatusMock =
  requestWorkspaceStatus as jest.MockedFunction<typeof requestWorkspaceStatus>;

describe('initCandidateWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends githubUsername in the init body', async () => {
    requestWorkspaceStatusMock.mockResolvedValue({
      repoName: 'acme/repo',
      repoFullName: 'acme/repo',
      codespaceUrl: 'https://codespaces.new/acme/repo',
      codespaceState: 'ready',
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    await initCandidateWorkspace({
      taskId: 41,
      candidateSessionId: 99,
      githubUsername: 'octocat',
    });

    expect(requestWorkspaceStatusMock).toHaveBeenCalledWith({
      path: '/tasks/41/codespace/init',
      candidateSessionId: 99,
      method: 'POST',
      body: { githubUsername: 'octocat' },
    });
  });
});
