import { jest } from '@jest/globals';
import {
  FetchMock,
  importCandidateApi,
  installFetchMock,
  jsonRes,
  restoreApiBase,
} from './candidateApi.testlib';

describe('candidateApi submit error handling', () => {
  afterAll(() => {
    restoreApiBase();
  });

  it('surfaces network TypeError as status 0 error', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockRejectedValue(new TypeError('offline'));
    installFetchMock(fetchMock);
    const { submitCandidateTask } = await importCandidateApi();
    await expect(
      submitCandidateTask({ taskId: 5, candidateSessionId: 9, contentText: 'Ok' }),
    ).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Network error'),
    });
  });

  it('maps submit 400/404/409/410 responses to HttpError', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(jsonRes({ details: 'oops' }, 400))
      .mockResolvedValueOnce(jsonRes({ details: 'missing' }, 404))
      .mockResolvedValueOnce(jsonRes({ details: 'dup' }, 409))
      .mockResolvedValueOnce(jsonRes({ details: 'expired' }, 410));
    installFetchMock(fetchMock);

    const { submitCandidateTask, HttpError } = await importCandidateApi();
    const params = { taskId: 5, candidateSessionId: 9, contentText: 'Ok' };

    await expect(submitCandidateTask(params)).rejects.toBeInstanceOf(HttpError);
    await expect(submitCandidateTask(params)).rejects.toBeInstanceOf(HttpError);
    await expect(submitCandidateTask(params)).rejects.toBeInstanceOf(HttpError);
    await expect(submitCandidateTask(params)).rejects.toBeInstanceOf(HttpError);
  });
});
