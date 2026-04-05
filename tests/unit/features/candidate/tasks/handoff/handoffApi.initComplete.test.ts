import {
  FetchMock,
  importHandoffApi,
  jsonRes,
  restoreHandoffApiEnv,
} from './handoffApi.testlib';

describe('handoffApi init and complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    restoreHandoffApiEnv();
  });

  it('initializes handoff upload with backend init contract', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        recordingId: 'rec_123',
        uploadUrl: 'https://storage.example.com/signed',
        expiresInSeconds: 1200,
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { initHandoffUpload } = await importHandoffApi();
    const result = await initHandoffUpload({
      taskId: 9,
      candidateSessionId: 44,
      contentType: 'video/mp4',
      sizeBytes: 2048,
      filename: 'demo.mp4',
    });
    expect(result).toEqual({
      recordingId: 'rec_123',
      uploadUrl: 'https://storage.example.com/signed',
      expiresInSeconds: 1200,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/tasks/9/presentation/upload/init',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-candidate-session-id': '44' }),
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body ?? '{}'))).toEqual({
      contentType: 'video/mp4',
      sizeBytes: 2048,
      filename: 'demo.mp4',
    });
  });

  it('completes upload using base contract payload', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({ recordingId: 'rec_22', status: 'uploaded' }, 200),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { completeHandoffUpload } = await importHandoffApi();
    const result = await completeHandoffUpload({
      taskId: 8,
      candidateSessionId: 22,
      recordingId: 'rec_22',
    });
    expect(result).toEqual({ recordingId: 'rec_22', status: 'uploaded' });
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body ?? '{}'))).toEqual({
      recordingId: 'rec_22',
    });
  });

  it('records privacy consent before complete and handles consent fallback/default versions', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(jsonRes({ status: 'consent_recorded' }, 200))
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_57', status: 'uploaded' }, 200),
      )
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_55', status: 'uploaded' }, 200),
      )
      .mockResolvedValueOnce(jsonRes({ accepted: true }, 200))
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_56', status: 'uploaded' }, 200),
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { completeHandoffUpload } = await importHandoffApi();

    await expect(
      completeHandoffUpload({
        taskId: 8,
        candidateSessionId: 22,
        recordingId: 'rec_57',
        consent: { consented: true, aiNoticeVersion: 'mvp1' },
      }),
    ).resolves.toEqual({ recordingId: 'rec_57', status: 'uploaded' });
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain(
      '/api/backend/candidate/session/22/privacy/consent',
    );
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[0] as [string, RequestInit])[1].body ?? '{}',
        ),
      ),
    ).toEqual({ noticeVersion: 'mvp1', aiNoticeVersion: 'mvp1' });

    await expect(
      completeHandoffUpload({
        taskId: 8,
        candidateSessionId: 22,
        recordingId: 'rec_55',
        consent: { consented: true, aiNoticeVersion: 'mvp1' },
      }),
    ).resolves.toEqual({ recordingId: 'rec_55', status: 'uploaded' });
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[3] as [string, RequestInit])[1].body ?? '{}',
        ),
      ),
    ).toEqual({
      recordingId: 'rec_55',
      consentAccepted: true,
      aiNoticeVersion: 'mvp1',
      noticeVersion: 'mvp1',
    });

    await expect(
      completeHandoffUpload({
        taskId: 8,
        candidateSessionId: 22,
        recordingId: 'rec_56',
        consent: { consented: true },
      }),
    ).resolves.toEqual({ recordingId: 'rec_56', status: 'uploaded' });
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[4] as [string, RequestInit])[1].body ?? '{}',
        ),
      ),
    ).toEqual({ noticeVersion: 'mvp1' });
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[5] as [string, RequestInit])[1].body ?? '{}',
        ),
      ),
    ).toEqual({ recordingId: 'rec_56' });
  });
});
