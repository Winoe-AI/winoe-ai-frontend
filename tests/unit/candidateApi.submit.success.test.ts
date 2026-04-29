import { jest } from '@jest/globals';
import {
  FetchMock,
  importCandidateApi,
  installFetchMock,
  jsonRes,
  restoreApiBase,
} from './candidateApi.testlib';

describe('candidateApi submit success paths', () => {
  afterAll(() => {
    restoreApiBase();
  });

  it('submits task payload with candidate-session header', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        submissionId: 3,
        taskId: 7,
        candidateSessionId: 1,
        submittedAt: '2025-01-01T00:00:00Z',
        progress: { completed: 1, total: 5 },
        isComplete: false,
      }),
    );
    installFetchMock(fetchMock);
    const { submitCandidateTask } = await importCandidateApi();
    await submitCandidateTask({
      taskId: 7,
      candidateSessionId: 1,
      contentText: 'Answer',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/tasks/7/submit',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-candidate-session-id': '1' }),
      }),
    );
  });

  it('normalizes commit/checkpoint/final sha submit fields', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        submissionId: 6,
        taskId: 7,
        candidateSessionId: 1,
        submittedAt: '2026-03-08T12:00:00Z',
        progress: { completed: 2, total: 5 },
        isComplete: false,
        commit_sha: 'abc123',
        checkpoint_sha: 'abc123',
      }),
    );
    installFetchMock(fetchMock);
    const { submitCandidateTask } = await importCandidateApi();
    const result = await submitCandidateTask({
      taskId: 7,
      candidateSessionId: 1,
      contentText: 'Answer',
    });
    expect(result).toMatchObject({
      commitSha: 'abc123',
      checkpointSha: 'abc123',
      finalSha: null,
    });
  });

  it('submits day-5 reflection payload fields', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        submissionId: 4,
        taskId: 5,
        candidateSessionId: 1,
        submittedAt: '2026-03-08T00:00:00Z',
        progress: { completed: 5, total: 5 },
        isComplete: true,
      }),
    );
    installFetchMock(fetchMock);
    const { submitCandidateTask } = await importCandidateApi();
    await submitCandidateTask({
      taskId: 5,
      candidateSessionId: 1,
      contentText:
        '## Experience & Challenges\n...\n## Decisions & Tradeoffs\n...',
      reflection: {
        challenges: 'a',
        decisions: 'b',
        tradeoffs: 'c',
        communication: 'd',
        next: 'e',
      },
    });
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      contentText: expect.stringContaining('## Experience & Challenges'),
      reflection: expect.objectContaining({
        challenges: expect.any(String),
        decisions: expect.any(String),
      }),
    });
  });
});
