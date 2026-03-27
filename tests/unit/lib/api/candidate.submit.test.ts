import { importCandidateApi, mockPost, resetCandidateApiMocks } from './candidate.testlib';

describe('candidate api submit-task helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('handles validation, conflict, network, session, and expiration statuses', async () => {
    const { submitCandidateTask } = await importCandidateApi();
    mockPost.mockRejectedValueOnce({ status: 400 });
    await expect(submitCandidateTask({ taskId: 1, candidateSessionId: 1 })).rejects.toMatchObject({ status: 400 });
    mockPost.mockRejectedValueOnce({ status: 409, details: 'dup' });
    await expect(submitCandidateTask({ taskId: 2, candidateSessionId: 2 })).rejects.toMatchObject({ status: 409 });
    mockPost.mockRejectedValueOnce(new TypeError('offline'));
    await expect(submitCandidateTask({ taskId: 3, candidateSessionId: 3 })).rejects.toMatchObject({ status: 0 });
    mockPost.mockRejectedValueOnce({ status: 404, details: 'mismatch' });
    await expect(submitCandidateTask({ taskId: 4, candidateSessionId: 4 })).rejects.toMatchObject({ status: 404 });
    mockPost.mockRejectedValueOnce({ status: 410 });
    await expect(submitCandidateTask({ taskId: 5, candidateSessionId: 5 })).rejects.toMatchObject({ status: 410 });
  });

  it('submits empty and text payload bodies correctly', async () => {
    const { submitCandidateTask } = await importCandidateApi();
    mockPost.mockResolvedValueOnce({ submissionId: 10 });
    await submitCandidateTask({ taskId: 8, candidateSessionId: 8 });
    expect(mockPost).toHaveBeenCalledWith('/tasks/8/submit', {}, expect.objectContaining({ headers: { 'Content-Type': 'application/json', 'x-candidate-session-id': '8' } }), expect.objectContaining({ basePath: '/api/backend' }));

    mockPost.mockResolvedValueOnce({ submissionId: 11 });
    await submitCandidateTask({ taskId: 9, candidateSessionId: 9, contentText: 'Hello world' });
    expect(mockPost).toHaveBeenCalledWith('/tasks/9/submit', { contentText: 'Hello world' }, expect.objectContaining({ headers: { 'Content-Type': 'application/json', 'x-candidate-session-id': '9' } }), expect.objectContaining({ basePath: '/api/backend' }));
  });

  it('submits day-5 reflection content and structured sections', async () => {
    mockPost.mockResolvedValueOnce({ submissionId: 12 });
    const { submitCandidateTask } = await importCandidateApi();
    await submitCandidateTask({
      taskId: 10,
      candidateSessionId: 10,
      contentText: '## Challenges\n...\n## Decisions\n...',
      reflection: { challenges: 'a', decisions: 'b', tradeoffs: 'c', communication: 'd', next: 'e' },
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/tasks/10/submit',
      expect.objectContaining({
        contentText: expect.stringContaining('## Challenges'),
        reflection: expect.objectContaining({ challenges: expect.any(String), decisions: expect.any(String), tradeoffs: expect.any(String), communication: expect.any(String), next: expect.any(String) }),
      }),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json', 'x-candidate-session-id': '10' } }),
      expect.objectContaining({ basePath: '/api/backend' }),
    );
  });

  it('maps unknown and unexpected submit errors', async () => {
    const { submitCandidateTask, HttpError } = await importCandidateApi();
    mockPost.mockRejectedValueOnce('oops');
    await expect(submitCandidateTask({ taskId: 6, candidateSessionId: 6 })).rejects.toBeInstanceOf(HttpError);
    mockPost.mockRejectedValueOnce({ status: 418 });
    await expect(submitCandidateTask({ taskId: 7, candidateSessionId: 7 })).rejects.toMatchObject({ status: 418, message: 'Something went wrong submitting your task.' });
  });
});
