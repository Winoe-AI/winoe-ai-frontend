import { importCandidateApi, mockGet, resetCandidateApiMocks } from './candidate.testlib';

describe('candidate api run status normalization', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('normalizes running/timeout/error/completed statuses', async () => {
    mockGet
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ conclusion: 'timed_out' })
      .mockResolvedValueOnce({ timeout: true, status: 'completed' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: 'failed', message: 'Red' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'failure' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'success' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'timed_out' })
      .mockResolvedValueOnce({ status: 'completed', conclusion: 'unknown' });

    const { pollCandidateTestRun } = await importCandidateApi();
    const params = (runId: string) => ({ taskId: 14, runId, candidateSessionId: 1 });
    await expect(pollCandidateTestRun(params('run-a'))).resolves.toEqual({ status: 'running', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-b'))).resolves.toEqual({ status: 'timeout', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-c'))).resolves.toEqual({ status: 'timeout', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-d'))).resolves.toEqual({ status: 'error', passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-e'))).resolves.toEqual({ status: 'failed', message: 'Red', passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-f'))).resolves.toEqual({ status: 'failed', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-g'))).resolves.toEqual({ status: 'passed', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-h'))).resolves.toEqual({ status: 'timeout', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
    await expect(pollCandidateTestRun(params('run-i'))).resolves.toEqual({ status: 'error', message: undefined, passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null });
  });
});
