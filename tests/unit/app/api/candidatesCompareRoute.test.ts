/**
 * Tests for /api/simulations/[id]/candidates/compare route
 */
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
      json: (body: unknown, init?: { status?: number }) =>
        buildResponse(init?.status ?? 200, body),
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      headers: { get: () => null };
      method = 'GET';

      constructor(url: string) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.headers = { get: () => null };
      }
    },
  };
});

const mockForwardJson = jest.fn();
const mockWithRecruiterAuth = jest.fn();

jest.mock('@/lib/server/bff', () => ({
  forwardJson: (...args: unknown[]) => mockForwardJson(...args),
}));

jest.mock('@/app/api/bffRouteHelpers', () => ({
  withRecruiterAuth: (...args: unknown[]) => mockWithRecruiterAuth(...args),
}));

describe('/api/simulations/[id]/candidates/compare route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod =
      await import('@/app/api/simulations/[id]/candidates/compare/route');
    markMetadataCovered('@/app/api/simulations/[id]/candidates/compare/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withRecruiterAuth and forwards compare request', async () => {
    mockWithRecruiterAuth.mockImplementation(
      async (
        _req: unknown,
        _opts: unknown,
        handler: (auth: {
          accessToken: string;
          requestId: string;
        }) => Promise<unknown>,
      ) => {
        return handler({ accessToken: 'token', requestId: 'req-compare' });
      },
    );
    mockForwardJson.mockResolvedValue({ rows: [] });

    const mod =
      await import('@/app/api/simulations/[id]/candidates/compare/route');
    markMetadataCovered('@/app/api/simulations/[id]/candidates/compare/route');

    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim-1/candidates/compare',
    );

    await mod.GET(req as never, {
      params: Promise.resolve({ id: 'sim-1' }),
    });

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      {
        tag: 'simulations-candidates-compare',
        requirePermission: 'recruiter:access',
      },
      expect.any(Function),
    );

    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/candidates/compare',
      accessToken: 'token',
      requestId: 'req-compare',
    });
  });

  it('encodes simulation id in compare route path', async () => {
    mockWithRecruiterAuth.mockImplementation(
      async (
        _req: unknown,
        _opts: unknown,
        handler: (auth: {
          accessToken: string;
          requestId: string;
        }) => Promise<unknown>,
      ) => {
        return handler({ accessToken: 'token', requestId: 'req-encode' });
      },
    );
    mockForwardJson.mockResolvedValue({ rows: [] });

    const mod =
      await import('@/app/api/simulations/[id]/candidates/compare/route');
    markMetadataCovered('@/app/api/simulations/[id]/candidates/compare/route');

    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim%2F1/candidates/compare',
    );

    await mod.GET(req as never, {
      params: Promise.resolve({ id: 'sim/1' }),
    });

    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/simulations/sim%2F1/candidates/compare',
      }),
    );
  });
});
