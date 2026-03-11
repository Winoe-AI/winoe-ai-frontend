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
    });
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
