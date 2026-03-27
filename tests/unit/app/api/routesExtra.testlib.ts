import { NextRequest, NextResponse } from 'next/server';

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
      set: (name: string | { name: string; value: string }, value?: string) =>
        typeof name === 'object'
          ? cookieStore.set(name.name, { name: name.name, value: name.value })
          : cookieStore.set(name, { name, value: value ?? '' }),
      getAll: () => Array.from(cookieStore.values()),
    },
  };
};

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL | string) => buildResponse(307, url.toString()),
    json: (
      _body: unknown,
      init?: { status?: number; headers?: Record<string, string> },
    ) => {
      const resp = buildResponse(init?.status ?? 200);
      Object.entries(init?.headers ?? {}).forEach(([k, v]) =>
        resp.headers.set(k, String(v)),
      );
      return resp;
    },
    next: () => buildResponse(200),
  },
  NextRequest: class {
    url: string;
    nextUrl: URL;
    headers: { get: (key: string) => string | null };
    method: string;
    signal: AbortSignal;
    constructor(
      url: URL | string,
      init?: { method?: string; headers?: Record<string, string> },
    ) {
      this.url = url.toString();
      this.nextUrl = new URL(this.url);
      this.method = init?.method ?? 'GET';
      const headerStore = new Map<string, string>();
      Object.entries(init?.headers ?? {}).forEach(([k, v]) =>
        headerStore.set(k.toLowerCase(), String(v)),
      );
      this.headers = {
        get: (key: string) => headerStore.get(key.toLowerCase()) ?? null,
      };
      // @ts-expect-error minimal AbortSignal
      this.signal = { aborted: false };
    }
  },
}));

export const mockRequireBffAuth = jest.fn();
export const mockMergeResponseCookies = jest.fn();
jest.mock('@/platform/server/bffAuth', () => ({
  requireBffAuth: (...args: unknown[]) => mockRequireBffAuth(...args),
  mergeResponseCookies: (...args: unknown[]) =>
    mockMergeResponseCookies(...args),
}));

export const mockForwardJson = jest.fn();
export const mockResolveRequestId = jest.fn(() => 'req-extra');
export const mockUpstreamRequest = jest.fn();
export const mockParseUpstreamBody = jest.fn();
jest.mock('@/platform/server/bff', () => ({
  forwardJson: (...args: unknown[]) => mockForwardJson(...args),
  resolveRequestId: () => mockResolveRequestId(),
  upstreamRequest: (...args: unknown[]) => mockUpstreamRequest(...args),
  parseUpstreamBody: (...args: unknown[]) => mockParseUpstreamBody(...args),
  REQUEST_ID_HEADER: 'x-request-id',
  UPSTREAM_HEADER: 'x-upstream',
  getBackendBaseUrl: () => 'http://backend',
}));

export const mockGetSessionNormalized = jest.fn();
jest.mock('@/platform/auth0', () => ({
  getSessionNormalized: (...args: unknown[]) =>
    mockGetSessionNormalized(...args),
}));

export const resetRoutesExtraMocks = () => jest.clearAllMocks();
export { NextRequest, NextResponse };
