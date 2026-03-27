import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => {
  const buildHeaders = () => {
    const store = new Map<string, string>();
    return {
      get: (key: string) => store.get(key.toLowerCase()) ?? null,
      set: (key: string, value: string) => store.set(key.toLowerCase(), value),
      delete: (key: string) => store.delete(key.toLowerCase()),
    };
  };

  const buildResponse = (status = 200, body?: unknown) => ({
    status,
    body,
    headers: buildHeaders(),
    cookies: { set: jest.fn(), get: jest.fn(), getAll: jest.fn(() => []) },
    json: async () => body,
  });

  class MockNextRequest {
    url: string;
    nextUrl: URL;
    method: string;
    headers: { get: (key: string) => string | null };
    constructor(url: URL | string, init?: { method?: string; headers?: Record<string, string> }) {
      this.url = url.toString();
      this.nextUrl = new URL(this.url);
      this.method = init?.method ?? 'GET';
      const headerStore = new Map<string, string>();
      Object.entries(init?.headers ?? {}).forEach(([key, value]) => headerStore.set(key.toLowerCase(), String(value)));
      this.headers = { get: (key: string) => headerStore.get(key.toLowerCase()) ?? null };
    }
    async json() { return {}; }
    async text() { return ''; }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => buildResponse(init?.status ?? 200, body),
      next: () => buildResponse(200),
      redirect: (url: URL | string) => {
        const response = buildResponse(307);
        response.headers.set('location', String(url));
        return response;
      },
    },
  };
});

export const mockRequireBffAuth = jest.fn();
export const mockMergeResponseCookies = jest.fn();
jest.mock('@/lib/server/bffAuth', () => ({
  requireBffAuth: (...args: unknown[]) => mockRequireBffAuth(...args),
  mergeResponseCookies: (...args: unknown[]) => mockMergeResponseCookies(...args),
}));

export const mockForwardJson = jest.fn();
export const mockResolveRequestId = jest.fn(() => 'req-cov');
jest.mock('@/lib/server/bff', () => ({
  forwardJson: (...args: unknown[]) => mockForwardJson(...args),
  resolveRequestId: () => mockResolveRequestId(),
  REQUEST_ID_HEADER: 'x-tenon-request-id',
  UPSTREAM_HEADER: 'x-tenon-upstream-status',
  getBackendBaseUrl: () => 'http://backend',
}));

export const mockBffAuthSuccess = () =>
  mockRequireBffAuth.mockResolvedValue({
    ok: true,
    accessToken: 'tok',
    permissions: ['recruiter:access'],
    cookies: NextResponse.next(),
  });

export const resetRouteCoverageMocks = () => jest.clearAllMocks();
export { NextRequest, NextResponse };
