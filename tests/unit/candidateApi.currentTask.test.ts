import { jest } from '@jest/globals';
import {
  FetchMock,
  importCandidateApi,
  installFetchMock,
  jsonRes,
  restoreApiBase,
} from './candidateApi.testlib';

describe('candidateApi current task', () => {
  afterAll(() => {
    restoreApiBase();
  });

  it('fetches current task with session-id header', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        isComplete: false,
        completedTaskIds: [],
        currentTask: { id: 2, dayIndex: 1, type: 'design', title: 'Plan', description: 'Draw it' },
      }),
    );
    installFetchMock(fetchMock);
    const { getCandidateCurrentTask } = await importCandidateApi();
    const result = await getCandidateCurrentTask(44);
    expect(result.currentTask?.id).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/44/current_task',
      expect.objectContaining({ headers: expect.objectContaining({ 'x-candidate-session-id': '44' }) }),
    );
  });

  it('hydrates recorded submission metadata and content fields', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        isComplete: false,
        completedTaskIds: [],
        currentTask: {
          id: 2,
          dayIndex: 5,
          type: 'documentation',
          title: 'Reflection',
          description: 'Summarize your work',
          recordedSubmission: {
            submissionId: 91,
            submittedAt: '2026-03-04T20:00:00Z',
            contentText: '',
            contentJson: { reflectionMarkdown: 'Final reflection body' },
          },
        },
      }),
    );
    installFetchMock(fetchMock);
    const { getCandidateCurrentTask } = await importCandidateApi();
    const result = await getCandidateCurrentTask(44);
    expect(result.currentTask?.recordedSubmission).toEqual({
      submissionId: 91,
      submittedAt: '2026-03-04T20:00:00Z',
      contentText: '',
      contentJson: { reflectionMarkdown: 'Final reflection body' },
    });
  });

  it('maps network failures to status 0', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockRejectedValue(new TypeError('offline'));
    installFetchMock(fetchMock);
    const { getCandidateCurrentTask } = await importCandidateApi();
    await expect(getCandidateCurrentTask(10)).rejects.toMatchObject({ status: 0 });
  });
});
