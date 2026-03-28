import {
  importCandidateApi,
  mockGet,
  mockPost,
  resetCandidateApiMocks,
} from './candidate.testlib';

describe('candidate api run helpers error paths', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('maps run start and poll network errors to status 0', async () => {
    const { startCandidateTestRun, pollCandidateTestRun } =
      await importCandidateApi();
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    await expect(
      startCandidateTestRun({ taskId: 21, candidateSessionId: 3 }),
    ).rejects.toMatchObject({ status: 0 });
    mockGet.mockRejectedValueOnce(new TypeError('offline'));
    await expect(
      pollCandidateTestRun({
        taskId: 21,
        runId: 'run-x',
        candidateSessionId: 3,
      }),
    ).rejects.toMatchObject({ status: 0 });
  });

  it('propagates run status backend errors via HttpError', async () => {
    mockGet.mockRejectedValueOnce({ status: 500 });
    const { pollCandidateTestRun, HttpError } = await importCandidateApi();
    await expect(
      pollCandidateTestRun({
        taskId: 41,
        runId: 'run-y',
        candidateSessionId: 4,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
