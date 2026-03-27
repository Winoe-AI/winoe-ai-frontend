import {
  FetchMock,
  importHandoffApi,
  jsonRes,
  restoreHandoffApiEnv,
} from './handoffApi.testlib';

describe('handoffApi status and delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    restoreHandoffApiEnv();
  });

  it('normalizes handoff status contracts including optional metadata', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(
        jsonRes({
          recording: {
            recordingId: 'rec_77',
            status: 'uploaded',
            downloadUrl: 'https://cdn.example.com/rec_77.mp4',
          },
          transcript: {
            status: 'processing',
            progress: 45,
            text: 'Hello from transcript',
            segments: [{ id: null, startMs: 0, endMs: 1250, text: 'Hello' }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonRes({
          handoff: {
            recording: { recordingId: 'rec_88', status: 'uploaded' },
            transcript: { status: 'ready' },
            consent: { accepted: true, acceptedAt: '2026-03-16T10:00:00.000Z' },
            aiNotice: {
              version: 'mvp1',
              enabled: true,
              summaryUrl: '/candidate/what-we-evaluate',
            },
            isDeleted: false,
            canDelete: false,
            deleteDisabledReason: 'Day 4 is closed.',
          },
        }),
      )
      .mockResolvedValueOnce(jsonRes({ recording: null, transcript: null }))
      .mockResolvedValueOnce(
        jsonRes({
          recording: { recordingId: 'rec_deleted', status: 'deleted' },
          transcript: null,
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { getHandoffStatus } = await importHandoffApi();

    await expect(
      getHandoffStatus({ taskId: 7, candidateSessionId: 77 }),
    ).resolves.toEqual({
      recordingId: 'rec_77',
      recordingStatus: 'uploaded',
      recordingDownloadUrl: 'https://cdn.example.com/rec_77.mp4',
      transcriptStatus: 'processing',
      transcriptProgressPct: 45,
      transcriptText: 'Hello from transcript',
      transcriptSegments: [
        { id: null, startMs: 0, endMs: 1250, text: 'Hello' },
      ],
      consentStatus: null,
      consentedAt: null,
      isDeleted: false,
      deletedAt: null,
      canDelete: null,
      deleteDisabledReason: null,
      aiNoticeVersion: null,
      aiNoticeEnabled: null,
      aiNoticeSummaryUrl: null,
    });
    await expect(
      getHandoffStatus({ taskId: 4, candidateSessionId: 77 }),
    ).resolves.toMatchObject({
      recordingId: 'rec_88',
      consentStatus: true,
      consentedAt: '2026-03-16T10:00:00.000Z',
      isDeleted: false,
      canDelete: false,
      deleteDisabledReason: 'Day 4 is closed.',
      aiNoticeVersion: 'mvp1',
      aiNoticeEnabled: true,
      aiNoticeSummaryUrl: '/candidate/what-we-evaluate',
    });
    await expect(
      getHandoffStatus({ taskId: 5, candidateSessionId: 33 }),
    ).resolves.toMatchObject({ transcriptStatus: 'not_started' });
    await expect(
      getHandoffStatus({ taskId: 5, candidateSessionId: 33 }),
    ).resolves.toMatchObject({
      recordingId: 'rec_deleted',
      recordingStatus: 'deleted',
      isDeleted: true,
      transcriptStatus: 'deleted',
    });
  });

  it('deletes handoff upload through recording delete endpoint', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValueOnce(
      jsonRes(
        {
          deleted: true,
          deletedAt: '2026-03-16T10:05:00.000Z',
          status: 'deleted',
        },
        200,
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { deleteHandoffUpload } = await importHandoffApi();
    await expect(
      deleteHandoffUpload({
        taskId: 4,
        candidateSessionId: 77,
        recordingId: 'rec_4',
      }),
    ).resolves.toEqual({
      deleted: true,
      deletedAt: '2026-03-16T10:05:00.000Z',
      status: 'deleted',
    });
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain(
      '/api/backend/recordings/rec_4/delete',
    );
  });

  it('maps TASK_WINDOW_CLOSED for init and preserves details payload', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes(
        {
          errorCode: 'TASK_WINDOW_CLOSED',
          detail: 'Window closed',
          retryable: true,
          details: {
            windowStartAt: '2026-03-11T14:00:00Z',
            windowEndAt: '2026-03-11T22:00:00Z',
            nextOpenAt: '2026-03-12T14:00:00Z',
          },
        },
        409,
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { initHandoffUpload } = await importHandoffApi();
    await expect(
      initHandoffUpload({
        taskId: 1,
        candidateSessionId: 2,
        contentType: 'video/mp4',
        sizeBytes: 100,
        filename: 'demo.mp4',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/closed/i),
      details: expect.objectContaining({ errorCode: 'TASK_WINDOW_CLOSED' }),
    });
  });
});
