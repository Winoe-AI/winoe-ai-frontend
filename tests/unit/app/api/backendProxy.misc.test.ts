import { TextEncoder } from 'util';
import {
  MockNextRequest,
  importBackendProxyRoute,
  makeResponse,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
} from './backendProxy.testlib';

describe('api/backend proxy route - misc branches', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('uses fallback arrayBuffer when stream missing and under limit', async () => {
    upstreamRequestMock.mockResolvedValue({
      status: 204,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({
        'content-type': 'text/plain',
      }),
      body: null,
      arrayBuffer: async () => new TextEncoder().encode('ok').buffer,
    } as unknown as Response);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/nobody'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(204);
  });

  it('logs when debug flags enabled', async () => {
    process.env.TENON_DEBUG = 'true';
    process.env.TENON_DEBUG_PERF = '1';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    upstreamRequestMock.mockResolvedValue(
      makeResponse(JSON.stringify({ ok: true }), {
        status: 204,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/path'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(204);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('handles arrayBuffer errors gracefully', async () => {
    upstreamRequestMock.mockResolvedValue({
      status: 201,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({
        'content-type': 'text/plain',
      }),
      body: null,
      arrayBuffer: async () => {
        throw new Error('fail');
      },
    } as unknown as Response);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/plain'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(201);
  });

  it('handles responses without content-type header', async () => {
    upstreamRequestMock.mockResolvedValue({
      status: 200,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({}),
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('ok'),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    } as unknown as Response);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/no-content-type'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(200);
  });

  it('routes all HTTP verbs through proxy', async () => {
    upstreamRequestMock.mockResolvedValue(
      makeResponse('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    );
    const mod = await importBackendProxyRoute();
    const ctx = { params: Promise.resolve({ path: [] as string[] }) };
    await mod.HEAD(new MockNextRequest('http://x', { method: 'HEAD' }), ctx);
    await mod.PUT(new MockNextRequest('http://x', { method: 'PUT' }), ctx);
    await mod.PATCH(new MockNextRequest('http://x', { method: 'PATCH' }), ctx);
    await mod.DELETE(
      new MockNextRequest('http://x', { method: 'DELETE' }),
      ctx,
    );
    expect(upstreamRequestMock).toHaveBeenCalledTimes(4);
  });
});
