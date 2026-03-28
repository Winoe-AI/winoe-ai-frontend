import { NextRequest } from 'next/server';
jest.mock('next/server', () => {
  const { MockNextRequest } = jest.requireActual('../app/api/mockNext');
  const makeResp = (status: number, location?: string) => {
    const headers = new Map<string, string>();
    if (location) headers.set('location', location);
    const cookies: {
      name: string;
      value?: string;
      path?: string;
      domain?: string;
    }[] = [];
    return {
      status,
      headers,
      cookies: {
        set: (cookie: {
          name: string;
          value?: string;
          path?: string;
          domain?: string;
        }) => cookies.push(cookie),
        delete: (cookie: { name: string; path?: string; domain?: string }) =>
          cookies.push({ ...cookie, value: undefined }),
        getAll: () => cookies,
      },
    };
  };
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      redirect: (url: URL | string) => makeResp(307, url.toString()),
      json: (body: unknown, init?: { status?: number }) =>
        Object.assign(makeResp(init?.status ?? 200), { body }),
      next: () => makeResp(200),
    },
  };
});
jest.mock('@/platform/auth/authCookies', () => ({
  ...jest.requireActual('@/platform/auth/authCookies'),
  isAuthCookie: jest.fn(
    (name: string) => name.startsWith('a0:') || name === 'appSession',
  ),
}));
jest.mock('@/platform/auth/routing', () => ({
  ...jest.requireActual('@/platform/auth/routing'),
  sanitizeReturnTo: jest.fn((value?: string | null) => value?.trim() || '/'),
  modeForPath: jest.fn(() => 'candidate'),
}));
const setReqCookies = (
  req: NextRequest,
  cookies: Array<{ name: string; value: string }>,
) => {
  (
    req as unknown as {
      cookies: { getAll: () => Array<{ name: string; value: string }> };
    }
  ).cookies = { getAll: () => cookies };
};
describe('auth clear route', () => {
  beforeEach(() => jest.clearAllMocks());
  it('clears auth cookies and sets domain when configured', async () => {
    process.env.TENON_AUTH0_COOKIE_DOMAIN = 'tenon.dev';
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2Fdash&mode=recruiter',
    );
    setReqCookies(req, [
      { name: 'appSession', value: '1' },
      { name: 'a0:state', value: '2' },
      { name: 'other', value: 'x' },
    ]);
    const res = (await GET(req as unknown as NextRequest)) as {
      status: number;
      cookies: { getAll: () => Array<{ name: string; value?: string }> };
    };
    expect(res.status).toBe(307);
    expect(res.cookies.getAll().map((c) => c.name)).toEqual(
      expect.arrayContaining(['appSession', 'a0:state']),
    );
    delete process.env.TENON_AUTH0_COOKIE_DOMAIN;
  });
  it('falls back to mode derived from returnTo when param missing', async () => {
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2Fcandidate%2Fdashboard',
    );
    setReqCookies(req, []);
    const res = await GET(req as unknown as NextRequest);
    expect(res.headers.get('location')).toContain('mode=candidate');
  });
  it('does not set domain when hostname has no dot', async () => {
    delete process.env.TENON_AUTH0_COOKIE_DOMAIN;
    jest.resetModules();
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest('http://localhost/auth/clear');
    setReqCookies(req, [{ name: 'appSession', value: '1' }]);
    const res = (await GET(req as unknown as NextRequest)) as {
      status: number;
      cookies: {
        getAll: () => Array<{ name: string; value?: string; domain?: string }>;
      };
    };
    expect(res.status).toBe(307);
    expect(res.cookies.getAll().some((c) => c.domain)).toBe(false);
  });
  it('uses hostname with dot as domain when env not set', async () => {
    delete process.env.TENON_AUTH0_COOKIE_DOMAIN;
    jest.resetModules();
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest('http://tenon.example.com/auth/clear');
    setReqCookies(req, [{ name: 'appSession', value: '1' }]);
    const res = (await GET(req as unknown as NextRequest)) as {
      cookies: {
        getAll: () => Array<{ name: string; value?: string; domain?: string }>;
      };
    };
    expect(
      res.cookies.getAll().some((c) => c.domain === 'tenon.example.com'),
    ).toBe(true);
  });
  it('uses recruiter mode when param is recruiter', async () => {
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2F&mode=recruiter',
    );
    setReqCookies(req, []);
    const res = await GET(req as unknown as NextRequest);
    expect(res.headers.get('location')).toContain('mode=recruiter');
  });
});
