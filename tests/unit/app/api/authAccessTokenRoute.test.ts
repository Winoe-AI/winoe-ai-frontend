import { GET } from '@/app/api/auth/access-token/route';

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

describe('auth/access-token route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    jest.clearAllMocks();
  });

  it('returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const res = await GET();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body).toEqual({ message: 'This endpoint has been disabled.' });
  });

  it('returns 404 in preview/prod', async () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ message: 'Not found' });
  });
});
