import { TextEncoder } from 'util';
import {
  MockNextRequest,
  importBackendProxyRoute,
  makeResponse,
  parseUpstreamBodyMock,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
} from './backendProxy.testlib';

describe('api/backend proxy route - parsing and metadata', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('parses JSON responses and attaches retry metadata', async () => {
    const upstream = makeResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as Response & { _tenonMeta?: unknown };
    upstream._tenonMeta = { attempts: 2, durationMs: 50 };
    upstreamRequestMock.mockResolvedValue(upstream);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/thing'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-request-id')).toBe('req-1');
    expect(resp.headers.get('Server-Timing')).toContain('retry;desc="count=1"');
  });

  it('falls back to parseUpstreamBody when stream is empty', async () => {
    upstreamRequestMock.mockResolvedValue(
      makeResponse(null, {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    parseUpstreamBodyMock.mockResolvedValue({ ok: 'fallback' });
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/empty'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(parseUpstreamBodyMock).toHaveBeenCalled();
    expect(resp.status).toBe(201);
  });

  it('handles empty JSON payload and parseUpstreamBody undefined', async () => {
    const upstream = {
      status: 200,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({
        'content-type': 'application/json',
      }),
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    } as unknown as Response;
    upstreamRequestMock.mockResolvedValue(upstream);
    parseUpstreamBodyMock.mockResolvedValue(undefined);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/empty-json'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(200);
  });

  it('parses empty JSON buffer to invalid-json fallback', async () => {
    upstreamRequestMock.mockResolvedValue(
      makeResponse('', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/empty-buffer'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchObject({ message: 'Invalid JSON from upstream' });
  });

  it('returns invalid JSON fallback when parse fails', async () => {
    const badBuffer = new TextEncoder().encode('{not-json').buffer;
    const upstream = {
      status: 200,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({
        'content-type': 'application/json',
      }),
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array(badBuffer),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    } as unknown as Response;
    upstreamRequestMock.mockResolvedValue(upstream);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/badjson'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchObject({ message: 'Invalid JSON from upstream' });
  });

  it('uses default meta values when attempts/duration missing', async () => {
    const upstream = makeResponse('ok', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    }) as Response & { _tenonMeta?: unknown };
    upstream._tenonMeta = {};
    upstreamRequestMock.mockResolvedValue(upstream);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/meta'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.headers.get('Server-Timing')).toContain('retry;desc="count=0"');
  });
});
