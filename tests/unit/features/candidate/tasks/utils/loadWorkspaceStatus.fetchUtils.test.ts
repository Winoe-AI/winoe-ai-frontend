import { fetchOrInitWorkspace } from '@/features/candidate/tasks/utils/loadWorkspaceStatus.fetchUtils';
import {
  getCandidateWorkspaceStatus,
  initCandidateWorkspace,
} from '@/features/candidate/session/api';
import { HttpError } from '@/platform/api-client/errors/errors';

jest.mock('@/features/candidate/session/api', () => ({
  getCandidateWorkspaceStatus: jest.fn(),
  initCandidateWorkspace: jest.fn(),
}));

const getStatusMock = getCandidateWorkspaceStatus as jest.MockedFunction<
  typeof getCandidateWorkspaceStatus
>;
const initWorkspaceMock = initCandidateWorkspace as jest.MockedFunction<
  typeof initCandidateWorkspace
>;

describe('fetchOrInitWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects init when github username is missing', async () => {
    getStatusMock.mockResolvedValue({
      repoName: null,
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    await expect(
      fetchOrInitWorkspace('init', false, 12, 34, null),
    ).rejects.toThrow(
      /GitHub username is required before Day 2 can initialize/i,
    );

    expect(initWorkspaceMock).not.toHaveBeenCalled();
  });

  it('retries init when status returns 410 Gone for an uninitialized workspace', async () => {
    getStatusMock.mockRejectedValueOnce(new HttpError(410, 'Gone'));
    initWorkspaceMock.mockResolvedValue({
      repoName: 'repo-1',
      repoFullName: 'org/repo-1',
      codespaceUrl: 'https://codespaces.new/org/repo-1?quickstart=1',
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    await expect(
      fetchOrInitWorkspace('init', false, 12, 34, 'candidate-one'),
    ).resolves.toEqual({
      repoName: 'repo-1',
      repoFullName: 'org/repo-1',
      codespaceUrl: 'https://codespaces.new/org/repo-1?quickstart=1',
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    expect(initWorkspaceMock).toHaveBeenCalledWith({
      taskId: 12,
      candidateSessionId: 34,
      githubUsername: 'candidate-one',
    });
  });
});
