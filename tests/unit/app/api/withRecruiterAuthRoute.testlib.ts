type AuthContext = { accessToken: string; requestId: string };

const buildResponse = (status = 200, body?: unknown) => ({
  status,
  body,
  headers: { get: () => null, set: () => {} },
  cookies: { set: () => {}, getAll: () => [] },
  json: async () => body,
});

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      buildResponse(init?.status ?? 200, body),
  },
  NextRequest: class {
    url: string;
    nextUrl: URL;
    headers: { get: () => null };
    method = 'GET';
    private body: unknown;

    constructor(url: string, body?: unknown) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.headers = { get: () => null };
      this.body = body;
    }

    async json() {
      if (this.body !== undefined) return this.body;
      throw new Error('No body');
    }
  },
}));

export const mockForwardJson = jest.fn();
export const mockWithRecruiterAuth = jest.fn();

jest.mock('@/lib/server/bff', () => ({
  forwardJson: (...args: unknown[]) => mockForwardJson(...args),
}));

jest.mock('@/app/api/bffRouteHelpers', () => ({
  withRecruiterAuth: (...args: unknown[]) => mockWithRecruiterAuth(...args),
}));

export function mockRecruiterAuthSuccess(
  requestId = 'req-123',
  accessToken = 'token',
) {
  mockWithRecruiterAuth.mockImplementation(
    async (
      _req: unknown,
      _opts: unknown,
      handler: (auth: AuthContext) => Promise<unknown>,
    ) => handler({ accessToken, requestId }),
  );
}

export async function createRequest(url: string, body?: unknown) {
  const { NextRequest } = await import('next/server');
  const RequestCtor = NextRequest as unknown as new (
    value: string,
    init?: unknown,
  ) => unknown;
  return new RequestCtor(url, body);
}
