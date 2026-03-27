import { markMetadataCovered } from './coverageHelpers';
class SimpleHeaders {
  private store = new Map<string, string>();
  constructor(init?: Record<string, string>) {
    Object.entries(init ?? {}).forEach(([k, v]) => this.store.set(k, v));
  }
  get(key: string) {
    return this.store.get(key.toLowerCase()) ?? null;
  }
  set(key: string, value: string) {
    this.store.set(key.toLowerCase(), value);
  }
  delete(key: string) {
    this.store.delete(key.toLowerCase());
  }
}
class SimpleResponse {
  status: number;
  headers: SimpleHeaders;
  constructor(_body: string, init: { status: number; headers?: Record<string, string> }) {
    this.status = init.status;
    this.headers = new SimpleHeaders(init.headers);
  }
}
const buildResponse = (status = 200, location?: string) => {
  const headerStore = new Map<string, string>();
  if (location) headerStore.set('location', location);
  const cookieStore = new Map<string, { name: string; value: string }>();
  return {
    status,
    headers: {
      get: (key: string) => headerStore.get(key) ?? null,
      set: (key: string, value: string) => headerStore.set(key, value),
      delete: (key: string) => headerStore.delete(key),
    },
    cookies: {
      set: (name: string | { name: string; value: string }, value?: string) => {
        if (typeof name === 'object' && name !== null) {
          cookieStore.set(name.name, { name: name.name, value: name.value });
          return;
        }
        cookieStore.set(name, { name, value: value ?? '' });
      },
      delete: (name: string) => cookieStore.delete(name),
      getAll: () => Array.from(cookieStore.values()),
    },
  };
};
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL | string) => buildResponse(307, url.toString()),
    json: (_body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
      const res = buildResponse(init?.status ?? 200);
      Object.entries(init?.headers ?? {}).forEach(([k, v]) => res.headers.set(k, String(v)));
      return res;
    },
    next: () => buildResponse(200),
  },
  NextRequest: class {
    url: string;
    nextUrl: URL;
    headers: Map<string, string>;
    method: string;
    signal: AbortSignal;
    constructor(url: URL | string, init?: { method?: string; headers?: Record<string, string> }) {
      this.url = url.toString();
      this.nextUrl = new URL(this.url);
      this.method = init?.method ?? 'GET';
      this.headers = new Map<string, string>();
      Object.entries(init?.headers ?? {}).forEach(([k, v]) => this.headers.set(k.toLowerCase(), String(v)));
      // @ts-expect-error minimal AbortSignal for route tests
      this.signal = { aborted: false };
    }
  },
}));
export const mockParseUpstreamBody = jest.fn(async () => ({}));
jest.mock('@/lib/server/bff', () => ({
  forwardJson: jest.fn(),
  getBackendBaseUrl: jest.fn(() => 'http://upstream'),
  parseUpstreamBody: mockParseUpstreamBody,
  resolveRequestId: jest.fn(() => 'req-1'),
  REQUEST_ID_HEADER: 'x-request-id',
  UPSTREAM_HEADER: 'x-upstream',
  upstreamRequest: jest.fn(),
}));
jest.mock('@/lib/auth0-claims', () => ({ extractPermissions: jest.fn(() => ['p1', 'p2']) }));
jest.mock('@/lib/auth0', () => ({ getSessionNormalized: jest.fn() }));
export const resetRoutesBasicMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
  const auth0 = jest.requireMock('@/lib/auth0');
  const getSessionMock = auth0.getSessionNormalized as jest.Mock;
  getSessionMock.mockResolvedValue({ user: null });
  return { getSessionMock };
};
export { SimpleResponse as GlobalResponse, markMetadataCovered };
