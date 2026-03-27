import { importCandidateApi, mockGet, mockPost, resetCandidateApiMocks } from './candidate.testlib';

describe('candidate api workspace helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('initializes workspace and normalizes response fields', async () => {
    mockPost.mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', codespaceUrl: 'https://codespaces.new/acme/repo' });
    const { initCandidateWorkspace } = await importCandidateApi();
    const result = await initCandidateWorkspace({ taskId: 11, candidateSessionId: 77 });
    expect(mockPost).toHaveBeenCalledWith('/tasks/11/codespace/init', {}, expect.objectContaining({ headers: { 'x-candidate-session-id': '77' } }), expect.objectContaining({ basePath: '/api/backend' }));
    expect(result).toEqual({ repoUrl: 'https://github.com/acme/repo', repoName: 'acme/repo', repoFullName: null, codespaceUrl: 'https://codespaces.new/acme/repo', codespaceState: null, cutoffCommitSha: null, cutoffAt: null });
  });

  it('fetches workspace status and normalizes snake_case + empty payloads', async () => {
    const { getCandidateWorkspaceStatus } = await importCandidateApi();
    mockGet.mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo2', repoName: 'acme/repo2' });
    await expect(getCandidateWorkspaceStatus({ taskId: 12, candidateSessionId: 88 })).resolves.toEqual({
      repoUrl: 'https://github.com/acme/repo2',
      repoName: 'acme/repo2',
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
    expect(mockGet).toHaveBeenCalledWith('/tasks/12/codespace/status', expect.objectContaining({ headers: { 'x-candidate-session-id': '88' } }), expect.objectContaining({ basePath: '/api/backend' }));

    mockGet.mockResolvedValueOnce({ repo_url: 'https://github.com/acme/repo3', repo_name: 'acme/repo3', repo_full_name: 'acme/repo3', codespace_url: 'https://codespaces.new/acme/repo3' });
    await expect(getCandidateWorkspaceStatus({ taskId: 14, candidateSessionId: 55 })).resolves.toEqual({
      repoUrl: 'https://github.com/acme/repo3',
      repoName: 'acme/repo3',
      repoFullName: 'acme/repo3',
      codespaceUrl: 'https://codespaces.new/acme/repo3',
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    mockGet.mockResolvedValueOnce(null);
    await expect(getCandidateWorkspaceStatus({ taskId: 15, candidateSessionId: 66 })).resolves.toEqual({
      repoUrl: null,
      repoName: null,
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    });
  });

  it('normalizes cutoff fields from workspace status payloads', async () => {
    mockGet.mockResolvedValueOnce({ repoUrl: 'https://github.com/acme/repo4', repoName: 'acme/repo4', cutoff_commit_sha: 'abc123def456', cutoff_at: '2026-03-08T17:45:00.000Z' });
    const result = await (await importCandidateApi()).getCandidateWorkspaceStatus({ taskId: 16, candidateSessionId: 99 });
    expect(result.cutoffCommitSha).toBe('abc123def456');
    expect(result.cutoffAt).toBe('2026-03-08T17:45:00.000Z');
  });

  it('maps workspace network and backend errors through HttpError', async () => {
    const { initCandidateWorkspace, getCandidateWorkspaceStatus, HttpError } = await importCandidateApi();
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    await expect(initCandidateWorkspace({ taskId: 20, candidateSessionId: 2 })).rejects.toMatchObject({ status: 0 });
    mockGet.mockRejectedValueOnce(new TypeError('offline'));
    await expect(getCandidateWorkspaceStatus({ taskId: 20, candidateSessionId: 2 })).rejects.toMatchObject({ status: 0 });
    mockPost.mockRejectedValueOnce({ status: 500 });
    await expect(initCandidateWorkspace({ taskId: 40, candidateSessionId: 4 })).rejects.toBeInstanceOf(HttpError);
    mockGet.mockRejectedValueOnce({ status: 500 });
    await expect(getCandidateWorkspaceStatus({ taskId: 40, candidateSessionId: 4 })).rejects.toBeInstanceOf(HttpError);
  });
});
