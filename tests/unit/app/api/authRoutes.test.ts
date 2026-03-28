import { MockNextRequest, MockNextResponse } from './mockNext';
const requireBffAuthMock = jest.fn();
const mergeResponseCookiesMock = jest.fn();
const forwardJsonMock = jest.fn();
const resolveRequestIdMock = jest.fn(() => 'req-auth');
jest.mock('next/server', () => {
  const { MockNextRequest, MockNextResponse } =
    jest.requireActual('./mockNext');
  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});
jest.mock('@/platform/server/bffAuth', () => ({
  requireBffAuth: (...args: unknown[]) => requireBffAuthMock(...args),
  mergeResponseCookies: (...args: unknown[]) =>
    mergeResponseCookiesMock(...args),
}));
jest.mock('@/platform/server/bff', () => ({
  forwardJson: (...args: unknown[]) => forwardJsonMock(...args),
  resolveRequestId: (...args: unknown[]) => resolveRequestIdMock(...args),
  REQUEST_ID_HEADER: 'x-request-id',
}));
describe('auth-related API routes', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });
  it('auth/access-token returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const { GET } = await import('@/app/api/auth/access-token/route');
    const res = await GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });
  it('auth/access-token returns 404 in preview/prod', async () => {
    process.env.VERCEL_ENV = 'preview';
    const { GET } = await import('@/app/api/auth/access-token/route');
    const res = await GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      message: 'Not found',
    });
  });
  it('dev/access-token returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const { GET } = await import('@/app/api/dev/access-token/route');
    const res = await GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });
  it('auth/me forwards profile request with request id', async () => {
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'me',
      cookies: [],
    });
    forwardJsonMock.mockResolvedValue(MockNextResponse.json({ ok: true }));
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET(new MockNextRequest('http://localhost/api/auth/me'));
    expect(res.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/auth/me',
        requestId: 'req-auth',
      }),
    );
  });
  it('auth/me returns auth failure path', async () => {
    const resp = MockNextResponse.json(
      { message: 'forbidden' },
      { status: 403 },
    );
    requireBffAuthMock.mockResolvedValue({
      ok: false,
      response: resp,
      cookies: [],
    });
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET(new MockNextRequest('http://localhost/api/auth/me'));
    expect(res.status).toBe(403);
    expect(res.headers.get('x-request-id')).toBe('req-auth');
  });
});
