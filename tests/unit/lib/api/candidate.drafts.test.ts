import {
  importCandidateApi,
  mockPost,
  mockRequestWithMeta,
  resetCandidateApiMocks,
} from './candidate.testlib';

describe('candidate api task-draft helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('rejects oversized draft payloads before network call', async () => {
    const { putCandidateTaskDraft, MAX_DRAFT_CONTENT_BYTES } =
      await importCandidateApi();
    await expect(
      putCandidateTaskDraft({
        taskId: 50,
        candidateSessionId: 5,
        payload: { contentText: 'x'.repeat(MAX_DRAFT_CONTENT_BYTES + 1) },
      }),
    ).rejects.toMatchObject({
      status: 413,
      details: expect.objectContaining({
        errorCode: 'DRAFT_CONTENT_TOO_LARGE',
      }),
    });
    expect(mockRequestWithMeta).not.toHaveBeenCalled();
  });

  it('maps DRAFT_CONTENT_TOO_LARGE backend responses to bounded-size message', async () => {
    mockPost.mockRejectedValueOnce({
      status: 413,
      details: { errorCode: 'DRAFT_CONTENT_TOO_LARGE' },
    });
    const { putCandidateTaskDraft, MAX_DRAFT_CONTENT_BYTES } =
      await importCandidateApi();
    await expect(
      putCandidateTaskDraft({
        taskId: 51,
        candidateSessionId: 5,
        payload: { contentText: 'ok' },
      }),
    ).rejects.toMatchObject({
      status: 413,
      message: `Draft exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes and could not be saved.`,
    });
  });
});
