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

jest.mock('@/platform/auth/authCookies', () => {
  const actual = jest.requireActual('@/platform/auth/authCookies');
  return {
    ...actual,
    isAuthCookie: jest.fn(
      (name: string) => name.startsWith('a0:') || name === 'appSession',
    ),
  };
});

jest.mock('@/platform/auth/routing', () => {
  const actual = jest.requireActual('@/platform/auth/routing');
  return {
    ...actual,
    sanitizeReturnTo: jest.fn((value?: string | null) => value?.trim() || '/'),
    modeForPath: jest.fn(() => 'candidate'),
  };
});

const withCookies = (
  req: NextRequest,
  cookies: Array<{ name: string; value: string }> = [],
) => {
  (
    req as unknown as {
      cookies: { getAll: () => Array<{ name: string; value: string }> };
    }
  ).cookies = { getAll: () => cookies };
};

describe('auth clear route extra coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.WINOE_AUTH0_COOKIE_DOMAIN;
    jest.resetModules();
  });

  it('ignores empty cookie domain env', async () => {
    process.env.WINOE_AUTH0_COOKIE_DOMAIN = '   ';
    jest.resetModules();
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest('http://test.example.com/auth/clear');
    withCookies(req, [{ name: 'appSession', value: '1' }]);

    const res = (await GET(req as unknown as NextRequest)) as {
      cookies: {
        getAll: () => Array<{ name: string; value?: string; domain?: string }>;
      };
    };
    expect(
      res.cookies.getAll().some((c) => c.domain === 'test.example.com'),
    ).toBe(true);
  });

  it('handles returnTo with query string', async () => {
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2Fdash%3Ffoo%3Dbar',
    );
    withCookies(req);
    const res = await GET(req as unknown as NextRequest);
    expect(res.headers.get('location')).toContain('returnTo=');
  });

  it('handles invalid mode param by inferring from path', async () => {
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2F&mode=invalid',
    );
    withCookies(req);
    const res = await GET(req as unknown as NextRequest);
    expect(res.headers.get('location')).toContain('mode=candidate');
  });

  it('handles candidate mode param', async () => {
    const { GET } = await import('@/app/(auth)/auth/clear/route');
    const req = new NextRequest(
      'http://localhost/auth/clear?returnTo=%2F&mode=candidate',
    );
    withCookies(req);
    const res = await GET(req as unknown as NextRequest);
    expect(res.headers.get('location')).toContain('mode=candidate');
  });
});
