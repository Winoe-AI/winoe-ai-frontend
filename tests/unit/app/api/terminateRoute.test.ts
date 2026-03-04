/**
 * Tests for /api/simulations/[id]/terminate route
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
      method = 'POST';

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

describe('/api/simulations/[id]/terminate route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/simulations/[id]/terminate/route');
    markMetadataCovered('@/app/api/simulations/[id]/terminate/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withRecruiterAuth and forwards terminate request', async () => {
    mockWithRecruiterAuth.mockImplementation(
      async (
        _req: unknown,
        _opts: unknown,
        handler: (auth: {
          accessToken: string;
          requestId: string;
        }) => Promise<unknown>,
      ) => handler({ accessToken: 'token', requestId: 'req-123' }),
    );
    mockForwardJson.mockResolvedValue({
      simulationId: 1,
      status: 'terminated',
    });

    const mod = await import('@/app/api/simulations/[id]/terminate/route');
    markMetadataCovered('@/app/api/simulations/[id]/terminate/route');

    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim-1/terminate',
    );

    await mod.POST(req as never, {
      params: Promise.resolve({ id: 'sim-1' }),
    });

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'terminate', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/terminate',
      method: 'POST',
      cache: 'no-store',
      accessToken: 'token',
      requestId: 'req-123',
    });
  });
});
