import { jest } from '@jest/globals';
import { responseHelpers } from '../../../../../../setup';

const jsonRes = (
  body: unknown,
  status?: number,
  headers?: Record<string, string>,
) => responseHelpers.jsonResponse(body, status, headers) as unknown as Response;
type FetchMock = jest.MockedFunction<typeof fetch>;

const originalApiBase = process.env.NEXT_PUBLIC_TENON_API_BASE_URL;
const OriginalXmlHttpRequest = global.XMLHttpRequest;

async function importHandoffApi() {
  jest.resetModules();
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = 'http://api.example.com';
  return import('@/features/candidate/session/task/handoff/handoffApi');
}

class MockXmlHttpRequest {
  static latest: MockXmlHttpRequest | null = null;

  readonly upload: {
    onprogress:
      | ((event: {
          lengthComputable: boolean;
          loaded: number;
          total: number;
        }) => void)
      | null;
  } = {
    onprogress: null,
  };

  status = 0;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onload: (() => void) | null = null;
  method: string | null = null;
  url: string | null = null;
  headers: Record<string, string> = {};
  body: unknown;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
    MockXmlHttpRequest.latest = this;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: unknown) {
    this.body = body;
  }

  abort() {
    this.onabort?.();
  }
}

describe('handoffApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_TENON_API_BASE_URL = originalApiBase;
    global.XMLHttpRequest = OriginalXmlHttpRequest;
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
      '/api/backend/tasks/9/handoff/upload/init',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-candidate-session-id': '44',
        }),
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({
      contentType: 'video/mp4',
      sizeBytes: 2048,
      filename: 'demo.mp4',
    });
  });

  it('completes upload with backend complete contract', async () => {
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
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({ recordingId: 'rec_22' });
  });

  it('falls back through consent endpoints and includes consent fields in complete payload when all are unavailable', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_55', status: 'uploaded' }, 200),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { completeHandoffUpload } = await importHandoffApi();
    const result = await completeHandoffUpload({
      taskId: 8,
      candidateSessionId: 22,
      recordingId: 'rec_55',
      consent: {
        consented: true,
        aiNoticeVersion: 'mvp1',
      },
    });

    expect(result).toEqual({ recordingId: 'rec_55', status: 'uploaded' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain(
      '/api/backend/tasks/8/handoff/consent',
    );
    expect(String(fetchMock.mock.calls[1]?.[0] ?? '')).toContain(
      '/api/backend/tasks/8/handoff/upload/consent',
    );
    expect(String(fetchMock.mock.calls[2]?.[0] ?? '')).toContain(
      '/api/backend/candidate/session/22/privacy/consent',
    );
    expect(String(fetchMock.mock.calls[3]?.[0] ?? '')).toContain(
      '/api/backend/tasks/8/handoff/upload/complete',
    );
    const [, requestInit] = fetchMock.mock.calls[3] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({
      recordingId: 'rec_55',
      consentAccepted: true,
      aiNoticeVersion: 'mvp1',
      noticeVersion: 'mvp1',
    });
  });

  it('records consent via candidate privacy endpoint when task consent endpoints are unavailable', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(
        jsonRes({ errorCode: 'NOT_FOUND', message: 'missing' }, 404),
      )
      .mockResolvedValueOnce(jsonRes({ status: 'consent_recorded' }, 200))
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_57', status: 'uploaded' }, 200),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { completeHandoffUpload } = await importHandoffApi();
    const result = await completeHandoffUpload({
      taskId: 8,
      candidateSessionId: 22,
      recordingId: 'rec_57',
      consent: {
        consented: true,
        aiNoticeVersion: 'mvp1',
      },
    });

    expect(result).toEqual({ recordingId: 'rec_57', status: 'uploaded' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[2]?.[0] ?? '')).toContain(
      '/api/backend/candidate/session/22/privacy/consent',
    );
    const [, consentInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    const consentBody = JSON.parse(String(consentInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(consentBody).toEqual({
      noticeVersion: 'mvp1',
      aiNoticeVersion: 'mvp1',
    });

    const [, requestInit] = fetchMock.mock.calls[3] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({ recordingId: 'rec_57' });
  });

  it('uses separate consent endpoint when available and keeps complete payload stable', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(jsonRes({ accepted: true }, 200))
      .mockResolvedValueOnce(
        jsonRes({ recordingId: 'rec_56', status: 'uploaded' }, 200),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { completeHandoffUpload } = await importHandoffApi();
    const result = await completeHandoffUpload({
      taskId: 8,
      candidateSessionId: 22,
      recordingId: 'rec_56',
      consent: {
        consented: true,
        aiNoticeVersion: 'mvp1',
      },
    });

    expect(result).toEqual({ recordingId: 'rec_56', status: 'uploaded' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, requestInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body ?? '{}')) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({ recordingId: 'rec_56' });
  });

  it('normalizes handoff status from backend status contract', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
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
          segments: [
            {
              id: null,
              startMs: 0,
              endMs: 1250,
              text: 'Hello',
            },
          ],
        },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getHandoffStatus } = await importHandoffApi();
    const status = await getHandoffStatus({
      taskId: 7,
      candidateSessionId: 77,
    });

    expect(status).toEqual({
      recordingId: 'rec_77',
      recordingStatus: 'uploaded',
      recordingDownloadUrl: 'https://cdn.example.com/rec_77.mp4',
      transcriptStatus: 'processing',
      transcriptProgressPct: 45,
      transcriptText: 'Hello from transcript',
      transcriptSegments: [
        {
          id: null,
          startMs: 0,
          endMs: 1250,
          text: 'Hello',
        },
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
  });

  it('normalizes optional consent/delete/notice metadata from nested handoff status', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        handoff: {
          recording: {
            recordingId: 'rec_88',
            status: 'uploaded',
          },
          transcript: {
            status: 'ready',
          },
          consent: {
            accepted: true,
            acceptedAt: '2026-03-16T10:00:00.000Z',
          },
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
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getHandoffStatus } = await importHandoffApi();
    const status = await getHandoffStatus({
      taskId: 4,
      candidateSessionId: 77,
    });

    expect(status).toMatchObject({
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
  });

  it('defaults status fields when backend has no recording or transcript', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        recording: null,
        transcript: null,
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getHandoffStatus } = await importHandoffApi();
    const status = await getHandoffStatus({
      taskId: 5,
      candidateSessionId: 33,
    });

    expect(status).toEqual({
      recordingId: null,
      recordingStatus: null,
      recordingDownloadUrl: null,
      transcriptStatus: 'not_started',
      transcriptProgressPct: null,
      transcriptText: null,
      transcriptSegments: null,
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
  });

  it('infers deleted state when backend only reports deleted recording status', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        recording: {
          recordingId: 'rec_deleted',
          status: 'deleted',
        },
        transcript: null,
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getHandoffStatus } = await importHandoffApi();
    const status = await getHandoffStatus({
      taskId: 5,
      candidateSessionId: 33,
    });

    expect(status).toMatchObject({
      recordingId: 'rec_deleted',
      recordingStatus: 'deleted',
      isDeleted: true,
      transcriptStatus: 'deleted',
    });
  });

  it('falls back to recording delete endpoint when task delete endpoints are unavailable', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(jsonRes({ errorCode: 'METHOD_NOT_ALLOWED' }, 405))
      .mockResolvedValueOnce(jsonRes({ errorCode: 'NOT_FOUND' }, 404))
      .mockResolvedValueOnce(
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
    const result = await deleteHandoffUpload({
      taskId: 4,
      candidateSessionId: 77,
      recordingId: 'rec_4',
    });

    expect(result).toEqual({
      deleted: true,
      deletedAt: '2026-03-16T10:05:00.000Z',
      status: 'deleted',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain(
      '/api/backend/tasks/4/handoff',
    );
    expect(String(fetchMock.mock.calls[1]?.[0] ?? '')).toContain(
      '/api/backend/tasks/4/handoff/delete',
    );
    expect(String(fetchMock.mock.calls[2]?.[0] ?? '')).toContain(
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
      details: expect.objectContaining({
        errorCode: 'TASK_WINDOW_CLOSED',
      }),
    });
  });

  it('uploads to signed URL with progress and content type', async () => {
    global.XMLHttpRequest =
      MockXmlHttpRequest as unknown as typeof XMLHttpRequest;
    const progressSpy = jest.fn();
    const { uploadFileToSignedUrl } = await importHandoffApi();
    const file = new File(['video'], 'demo.mp4', { type: 'video/mp4' });

    const uploadPromise = uploadFileToSignedUrl({
      uploadUrl: 'https://storage.example.com/signed',
      file,
      onProgress: progressSpy,
    });
    const xhr = MockXmlHttpRequest.latest as MockXmlHttpRequest;
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe('https://storage.example.com/signed');
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 5,
      total: 10,
    });
    xhr.status = 200;
    xhr.onload?.();

    await expect(uploadPromise).resolves.toBeUndefined();
    expect(progressSpy).toHaveBeenCalledWith(50);
    expect(progressSpy).toHaveBeenCalledWith(100);
    expect(xhr.headers['Content-Type']).toBe('video/mp4');
  });
});
