import {
  importCandidateApi,
  mockGet,
  resetCandidateApiMocks,
} from './candidate.testlib';

describe('candidate api current-task helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('maps network and status-based task fetch errors', async () => {
    const { getCandidateCurrentTask, HttpError } = await importCandidateApi();
    mockGet.mockRejectedValueOnce(new TypeError('network'));
    await expect(getCandidateCurrentTask(1)).rejects.toMatchObject({
      status: 0,
    });
    mockGet.mockRejectedValueOnce({ status: 404, details: 'missing' });
    await expect(getCandidateCurrentTask(2)).rejects.toMatchObject({
      status: 404,
    });
    mockGet.mockRejectedValueOnce({ status: 410 });
    await expect(getCandidateCurrentTask(3)).rejects.toMatchObject({
      status: 410,
    });
    mockGet.mockRejectedValueOnce({ status: 500, details: 'fail' });
    await expect(getCandidateCurrentTask(9)).rejects.toMatchObject({
      status: 500,
    });
    mockGet.mockRejectedValueOnce({ status: 'oops' });
    await expect(getCandidateCurrentTask(1)).rejects.toMatchObject({
      status: 0,
    });
    mockGet.mockRejectedValueOnce('boom');
    await expect(getCandidateCurrentTask(1)).rejects.toBeInstanceOf(HttpError);
  });

  it('normalizes cutoff fields from root task records', async () => {
    mockGet.mockResolvedValueOnce({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 41,
        dayIndex: 2,
        type: 'code',
        title: 'Code task',
        description: 'Implement feature',
        cutoff_commit_sha: 'abc123def456',
        cutoff_at: '2026-03-08T17:45:00.000Z',
      },
    });
    const result = await (
      await importCandidateApi()
    ).getCandidateCurrentTask(777);
    expect(result?.currentTask).toMatchObject({
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });
  });

  it('normalizes cutoff fields from nested evaluation basis', async () => {
    mockGet.mockResolvedValueOnce({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 42,
        dayIndex: 3,
        type: 'debug',
        title: 'Debug task',
        description: 'Fix failing tests',
        workspaceStatus: { repoFullName: 'acme/repo' },
        workspace_status: { codespaceUrl: 'https://codespaces.new/acme/repo' },
        workspace: { status: 'ready' },
        integrity: { status: 'ok' },
        evaluationBasis: { source: 'latest' },
        evaluation_basis: {
          cutoff_commit_sha: 'laternestedsha123',
          cutoff_at: '2026-03-08T18:15:00.000Z',
        },
      },
    });
    const result = await (
      await importCandidateApi()
    ).getCandidateCurrentTask(778);
    expect(result?.currentTask).toMatchObject({
      cutoffCommitSha: 'laternestedsha123',
      cutoffAt: '2026-03-08T18:15:00.000Z',
    });
  });
});
