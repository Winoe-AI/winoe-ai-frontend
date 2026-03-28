import {
  GET,
  NextRequest,
  fetchMock,
  mockResponse,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - size limits', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('returns 502 when upstream response content-length exceeds cap', async () => {
    const resp = mockResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-length': '5000000',
      },
    });
    const arrayBufferSpy = jest.spyOn(
      resp as unknown as { arrayBuffer: () => Promise<ArrayBuffer> },
      'arrayBuffer',
    );
    fetchMock.mockResolvedValueOnce(resp);

    const res = await GET(
      new NextRequest('http://localhost/api/backend/huge') as never,
      { params: Promise.resolve({ path: ['huge'] }) },
    );

    expect(res.status).toBe(502);
    expect(res.headers.get('x-tenon-request-id')).toBe('req-test');
    expect(arrayBufferSpy).not.toHaveBeenCalled();
  });

  it('returns 502 when streamed response exceeds cap', async () => {
    const bigChunk = new Uint8Array(2 * 1024 * 1024 + 10);
    const reader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({ done: false, value: bigChunk })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    const cancel = jest.fn();

    fetchMock.mockResolvedValueOnce({
      status: 200,
      headers: {
        get: (key: string) =>
          key.toLowerCase() === 'content-type' ? 'application/json' : null,
        forEach: (cb: (value: string, key: string) => void) => {
          cb('application/json', 'content-type');
        },
      },
      body: { getReader: () => reader, cancel },
      json: async () => ({}),
      text: async () => '{}',
    } as unknown as Response);

    const res = await GET(
      new NextRequest('http://localhost/api/backend/huge-stream') as never,
      { params: Promise.resolve({ path: ['huge-stream'] }) },
    );

    expect(res.status).toBe(502);
    expect(res.headers.get('x-tenon-request-id')).toBe('req-test');
    expect(cancel).toHaveBeenCalled();
  });

  it('returns 413 when request body exceeds limit', async () => {
    const req = new NextRequest('http://localhost/api/backend/oversize', {
      method: 'POST',
      headers: { 'content-length': '5000000' },
    }) as never;
    const textSpy = jest.fn(async () => '');
    (req as unknown as { text: () => Promise<string> }).text = textSpy;

    const res = await GET(req, {
      params: Promise.resolve({ path: ['oversize'] }),
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(413);
    expect(res.headers.get('x-tenon-request-id')).toBe('req-test');
    expect(textSpy).not.toHaveBeenCalled();
  });
});
