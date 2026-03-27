import {
  MockNextRequest,
  importBackendProxyRoute,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
  makeResponse,
} from './backendProxy.testlib';

describe('api/backend proxy route - request body limits', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('returns 400 when request body cannot be read', async () => {
    const { POST } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/tasks/run', {
      method: 'POST',
      headers: { 'content-length': '10' },
      failOnRead: true,
    });
    const resp = await POST(req, { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) });
    expect(resp.status).toBe(400);
    expect(resp.headers.get('x-request-id')).toBe('req-1');
    expect(resp.headers.get('x-upstream')).toBe('400');
  });

  it('returns 413 when body exceeds configured limit', async () => {
    process.env.TENON_PROXY_MAX_BODY_BYTES = '5';
    const { POST } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/tasks/run', { method: 'POST', headers: { 'content-length': '10' }, bodyText: '0123456789' });
    const resp = await POST(req, { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) });
    expect(resp.status).toBe(413);
    expect(resp.headers.get('x-upstream')).toBe('413');
  });

  it('handles large body after read when content-length absent', async () => {
    process.env.TENON_PROXY_MAX_BODY_BYTES = '2';
    const { POST } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/submit', { method: 'POST', bodyText: 'abcd' });
    const resp = await POST(req, { params: Promise.resolve({ path: ['tasks', 'id', 'submit'] }) });
    expect(resp.status).toBe(413);
  });

  it('falls back to body length when Buffer is undefined', async () => {
    const originalBuffer = global.Buffer;
    // @ts-expect-error test fallback path
    global.Buffer = undefined;
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'application/json' } }));
    const { POST } = await importBackendProxyRoute();
    const resp = await POST(new MockNextRequest('http://localhost/api/backend/run', { method: 'POST', bodyText: 'a' }), { params: Promise.resolve({ path: ['tasks', '1', 'run'] }) });
    expect(resp.status).toBe(200);
    global.Buffer = originalBuffer;
  });

  it('leaves body undefined when empty payload provided', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'application/json' } }));
    const { POST } = await importBackendProxyRoute();
    await POST(new MockNextRequest('http://localhost/api/backend/empty-body', { method: 'POST', bodyText: '' }), { params: Promise.resolve({ path: ['any'] }) });
    const lastCall = upstreamRequestMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.body).toBeUndefined();
  });
});
