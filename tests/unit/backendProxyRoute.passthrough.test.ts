import { TextDecoder } from 'util';
import {
  GET,
  NextRequest,
  type FakeResponseShape,
  encoder,
  fetchMock,
  mockResponse,
  parseUpstreamBodyMock,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
  upstreamRequestMock,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - passthrough responses', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('passes through JSON responses and sets headers', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const res = await GET(new NextRequest('http://localhost/api/backend/foo?x=1') as never, { params: Promise.resolve({ path: ['foo'] }) });
    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/api/foo?x=1', expect.objectContaining({ redirect: 'manual' }));
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers | Record<string, string>;
    const requestId = typeof (headers as Headers).get === 'function' ? (headers as Headers).get('x-tenon-request-id') : (headers as Record<string, string>)['x-tenon-request-id'];
    expect(requestId).toBe('req-test');
    expect(res.status).toBe(200);
    expect((res as FakeResponseShape).body).toEqual({ ok: true });
    expect(res.headers.get('x-tenon-upstream-status')).toBe('200');
    expect(res.headers.get('x-tenon-request-id')).toBe('req-test');
  });

  it('threads request signal to upstream call', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const req = new NextRequest('http://localhost/api/backend/signal');
    await GET(req, { params: Promise.resolve({ path: ['signal'] }) });
    expect(upstreamRequestMock).toHaveBeenCalledWith(expect.objectContaining({ signal: req.signal }));
  });

  it('passes through non-JSON content and preserves content-type', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse('plain body', { status: 201, headers: { 'content-type': 'text/plain' } }));
    const res = await GET(new NextRequest('http://localhost/api/backend/bar') as never, { params: Promise.resolve({ path: ['bar'] }) });
    const decoded = new TextDecoder().decode((res as FakeResponseShape).body as ArrayBuffer);
    expect(res.status).toBe(201);
    expect(decoded).toBe('plain body');
    expect(res.headers.get('content-type')).toBe('text/plain');
  });

  it('returns stable error for invalid json without re-reading body', async () => {
    parseUpstreamBodyMock.mockClear();
    const reader = { read: jest.fn().mockResolvedValueOnce({ done: false, value: encoder.encode('not-json') }).mockResolvedValueOnce({ done: true, value: undefined }) };
    fetchMock.mockResolvedValueOnce({
      status: 200,
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null), forEach: (cb: (v: string, k: string) => void) => cb('application/json', 'content-type') },
      body: { getReader: () => reader, cancel: jest.fn() },
      json: async () => ({}),
      text: async () => '{}',
    } as unknown as Response);
    const res = await GET(new NextRequest('http://localhost/api/backend/bad-json') as never, { params: Promise.resolve({ path: ['bad-json'] }) });
    expect(res.status).toBe(200);
    expect((res as FakeResponseShape).body).toEqual({ message: 'Invalid JSON from upstream' });
    expect(parseUpstreamBodyMock).not.toHaveBeenCalled();
  });
});
