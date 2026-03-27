import { importCandidateApi, mockGet, mockPost, resetCandidateApiMocks } from './candidate.testlib';

describe('candidate api run helpers success paths', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('starts and polls candidate test runs', async () => {
    mockPost.mockResolvedValueOnce({ runId: 'run-xyz' });
    mockGet.mockResolvedValueOnce({ status: 'completed', conclusion: 'success', message: 'All green', passed: 3, failed: 1, total: 4, stdout: 'ok', stderr: '', workflowUrl: 'https://github.com/acme/repo/actions/runs/44', commitSha: 'abc123' });
    const { startCandidateTestRun, pollCandidateTestRun } = await importCandidateApi();
    await expect(startCandidateTestRun({ taskId: 13, candidateSessionId: 99 })).resolves.toEqual({ runId: 'run-xyz' });
    expect(mockPost).toHaveBeenCalledWith('/tasks/13/run', {}, expect.objectContaining({ headers: { 'x-candidate-session-id': '99' } }), expect.objectContaining({ basePath: '/api/backend' }));
    await expect(pollCandidateTestRun({ taskId: 13, runId: 'run-xyz', candidateSessionId: 99 })).resolves.toEqual({
      status: 'passed',
      message: 'All green',
      passed: 3,
      failed: 1,
      total: 4,
      stdout: 'ok',
      stderr: null,
      workflowUrl: 'https://github.com/acme/repo/actions/runs/44',
      commitSha: 'abc123',
    });
  });

  it('accepts numeric run id values from start responses', async () => {
    const { startCandidateTestRun } = await importCandidateApi();
    mockPost.mockResolvedValueOnce({ runId: 12345 });
    await expect(startCandidateTestRun({ taskId: 21, candidateSessionId: 77 })).resolves.toEqual({ runId: '12345' });
    mockPost.mockResolvedValueOnce({ runId: 20908570424, passed: 3, failed: 1, total: 4, stdout: 'ok', stderr: '', timeout: false, conclusion: 'failure', workflowUrl: 'https://github.com/acme/repo/actions/runs/1', commitSha: 'abc123' });
    await expect(startCandidateTestRun({ taskId: 22, candidateSessionId: 88 })).resolves.toEqual({ runId: '20908570424' });
  });

  it('throws HttpError when start response is missing runId', async () => {
    mockPost.mockResolvedValueOnce({});
    const { startCandidateTestRun, HttpError } = await importCandidateApi();
    await expect(startCandidateTestRun({ taskId: 30, candidateSessionId: 4 })).rejects.toBeInstanceOf(HttpError);
  });
});
