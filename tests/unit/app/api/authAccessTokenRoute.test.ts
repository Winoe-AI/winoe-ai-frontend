import { GET } from '@/app/api/auth/access-token/route';
import { NextRequest } from 'next/server';

const requireBffAuthMock = jest.fn();

jest.mock('next/server', () => {
  class SimpleNextRequest {
    nextUrl: URL;
    constructor(public url: string) {
      this.nextUrl = new URL(url);
    }
  }
  return {
    NextRequest: SimpleNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => {
        return {
          status: init?.status ?? 200,
          json: async () => body,
          headers: {
            get: () => null,
            set: () => undefined,
            delete: () => undefined,
          },
          cookies: { set: () => undefined, getAll: () => [] },
        };
      },
      next: () => ({ cookies: { getAll: () => [] } }),
    },
  };
});

jest.mock('@/lib/server/bffAuth', () => ({
  requireBffAuth: (...args: unknown[]) => requireBffAuthMock(...args),
  mergeResponseCookies: jest.fn(),
}));

describe('auth/access-token route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('returns token json in test mode when auth succeeds', async () => {
    process.env.NODE_ENV = 'test';
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'token-1',
      cookies: null,
    });

    const req = new NextRequest('http://localhost/api/auth/access-token');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ accessToken: 'token-1' });
  });

  it('returns 404 in production', async () => {
    process.env.NODE_ENV = 'production';
    const req = new NextRequest('http://localhost/api/auth/access-token');
    const res = await GET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ message: 'Not found' });
  });
});
