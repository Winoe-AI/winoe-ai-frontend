import { markMetadataCovered } from './coverageHelpers';

jest.mock('next/server', () => {
  const buildResponse = (status = 200, body?: unknown) => ({
    status,
    body,
    headers: { get: () => null, set: () => {} },
    cookies: { set: () => {}, getAll: () => [] },
    json: async () => body,
  });
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => buildResponse(init?.status ?? 200, body),
      next: () => buildResponse(200),
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      headers: { get: () => null };
      constructor(url: URL | string) {
        this.url = url.toString();
        this.nextUrl = new URL(this.url);
        this.headers = { get: () => null };
      }
    },
  };
});

const routes = [
  { importPath: '@/app/api/auth/access-token/route', coveragePath: '@/app/api/auth/access-token/route' },
  { importPath: '@/app/api/dev/access-token/route', coveragePath: '@/app/api/dev/access-token/route' },
] as const;

describe('disabled access token routes', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    jest.resetModules();
  });

  it.each(routes)('covers metadata exports: $coveragePath', async ({ importPath, coveragePath }) => {
    const mod = await import(importPath);
    markMetadataCovered(coveragePath);
    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it.each(routes)('returns 410 in local development: $coveragePath', async ({ importPath }) => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import(importPath);
    const res = await mod.GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({ message: 'This endpoint has been disabled.' });
  });

  it.each(routes)('returns 404 outside local: $coveragePath', async ({ importPath }) => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import(importPath);
    const res = await mod.GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: 'Not found' });
  });
});
