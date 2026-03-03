/**
 * Tests for disabled access token routes
 */
import { markMetadataCovered } from './coverageHelpers';

jest.mock('next/server', () => {
  const buildHeaders = () => {
    const store = new Map<string, string>();
    return {
      get: (key: string) => store.get(key.toLowerCase()) ?? null,
      set: (key: string, value: string) => store.set(key.toLowerCase(), value),
    };
  };

  const buildCookies = () => {
    const cookieStore = new Map<string, { name: string; value: string }>();
    return {
      set: (name: string | { name: string; value: string }, value?: string) => {
        if (typeof name === 'object') {
          cookieStore.set(name.name, { name: name.name, value: name.value });
          return;
        }
        cookieStore.set(name, { name, value: value ?? '' });
      },
      getAll: () => Array.from(cookieStore.values()),
      get: (name: string) => cookieStore.get(name),
    };
  };

  const buildResponse = (status = 200, body?: unknown) => ({
    status,
    body,
    headers: buildHeaders(),
    cookies: buildCookies(),
    json: async () => body,
  });

  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) =>
        buildResponse(init?.status ?? 200, body),
      next: () => buildResponse(200),
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      headers: { get: (key: string) => string | null };
      constructor(url: URL | string, headers?: Record<string, string>) {
        this.url = url.toString();
        this.nextUrl = new URL(this.url);
        const headerStore = new Map<string, string>();
        Object.entries(headers ?? {}).forEach(([k, v]) =>
          headerStore.set(k.toLowerCase(), String(v)),
        );
        this.headers = {
          get: (key: string) => headerStore.get(key.toLowerCase()) ?? null,
        };
      }
    },
  };
});

describe('/api/auth/access-token route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/auth/access-token/route');
    markMetadataCovered('@/app/api/auth/access-token/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('@/app/api/auth/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });

  it('returns 404 outside local', async () => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import('@/app/api/auth/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: 'Not found' });
  });
});

describe('/api/dev/access-token route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/dev/access-token/route');
    markMetadataCovered('@/app/api/dev/access-token/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('@/app/api/dev/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });

  it('returns 404 outside local', async () => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import('@/app/api/dev/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: 'Not found' });
  });
});
