jest.mock('@auth0/nextjs-auth0/testing', () => ({
  generateSessionCookie: jest.fn(async () => 'encrypted-session-cookie'),
}));

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
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        json: async () => body,
      }),
      redirect: (url: URL) => {
        const headers = new Map<string, string>([['location', url.toString()]]);
        const cookies: Array<Record<string, unknown>> = [];
        return {
          status: 307,
          headers: { get: (name: string) => headers.get(name) ?? null },
          cookies: {
            set: (
              name: string,
              value: string,
              options: Record<string, unknown>,
            ) => cookies.push({ name, value, ...options }),
            getAll: () => cookies,
          },
        };
      },
    },
  };
});

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/dev/qa-login/route';

describe('/api/dev/qa-login route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.WINOE_AUTH0_SECRET;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.WINOE_AUTH0_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) {
      delete process.env.WINOE_AUTH0_SECRET;
    } else {
      process.env.WINOE_AUTH0_SECRET = originalSecret;
    }
    jest.clearAllMocks();
  });

  it('mints local talent-partner session and redirects to /dashboard/trials', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/dev/qa-login?role=talent_partner'),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost/dashboard/trials',
    );
    const cookies = res.cookies.getAll();
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '__session',
          value: 'encrypted-session-cookie',
          httpOnly: true,
          sameSite: 'lax',
        }),
      ]),
    );
  });

  it('mints local candidate session and redirects to candidate dashboard', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/dev/qa-login?role=candidate'),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost/candidate/dashboard',
    );
  });

  it('returns 404 when not in local development', async () => {
    process.env.NODE_ENV = 'production';
    const res = await GET(
      new NextRequest('http://localhost/api/dev/qa-login?role=talent_partner'),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ message: 'Not found' });
  });
});
