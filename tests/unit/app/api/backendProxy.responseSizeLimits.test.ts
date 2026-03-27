import { TextEncoder } from 'util';
import {
  MockNextRequest,
  importBackendProxyRoute,
  makeResponse,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
} from './backendProxy.testlib';

describe('api/backend proxy route - response size limits', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('rejects responses with oversized content-length header', async () => {
    process.env.TENON_PROXY_MAX_RESPONSE_BYTES = '5';
    upstreamRequestMock.mockResolvedValue(makeResponse('oversized', { status: 200, headers: { 'content-type': 'text/plain', 'content-length': '25' } }));
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(new MockNextRequest('http://localhost/api/backend/text'), { params: Promise.resolve({ path: [] }) });
    expect(resp.status).toBe(502);
    expect(resp.headers.get('x-upstream')).toBe('200');
  });

  it('terminates when streamed body exceeds limit', async () => {
    process.env.TENON_PROXY_MAX_RESPONSE_BYTES = '5';
    upstreamRequestMock.mockResolvedValue(makeResponse('abcdefg', { status: 200, headers: { 'content-type': 'text/plain' } }));
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(new MockNextRequest('http://localhost/api/backend/text'), { params: Promise.resolve({ path: [] }) });
    expect(resp.status).toBe(502);
  });

  it('cancels stream when exceeding limit (readStreamWithLimit)', async () => {
    process.env.TENON_PROXY_MAX_RESPONSE_BYTES = '2';
    const body = {
      cancel: jest.fn().mockResolvedValue(undefined),
      getReader: () => ({ read: jest.fn().mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) }).mockResolvedValueOnce({ done: true, value: undefined }) }),
    };
    upstreamRequestMock.mockResolvedValue({
      status: 200,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({ 'content-type': 'application/json' }),
      body,
    } as unknown as Response);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(new MockNextRequest('http://localhost/api/backend/limit'), { params: Promise.resolve({ path: [] }) });
    expect(resp.status).toBe(502);
    expect((body.cancel as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  it('blocks oversized JSON streams', async () => {
    process.env.TENON_PROXY_MAX_RESPONSE_BYTES = '2';
    upstreamRequestMock.mockResolvedValue(makeResponse(JSON.stringify({ msg: 'way too long' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(new MockNextRequest('http://localhost/api/backend/json'), { params: Promise.resolve({ path: [] }) });
    expect(resp.status).toBe(502);
  });

  it('uses fallback arrayBuffer limit for non-JSON responses', async () => {
    process.env.TENON_PROXY_MAX_RESPONSE_BYTES = '3';
    const oversizedBuffer = new TextEncoder().encode('abcdefgh').buffer;
    upstreamRequestMock.mockResolvedValue({
      status: 200,
      headers: new (jest.requireActual('./mockNext').MockHeaders)({ 'content-type': 'text/plain' }),
      body: null,
      arrayBuffer: async () => oversizedBuffer,
    } as unknown as Response);
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(new MockNextRequest('http://localhost/api/backend/plain'), { params: Promise.resolve({ path: [] }) });
    expect(resp.status).toBe(502);
  });
});
