jest.mock('next/server', () => {
  const buildHeaders = (init?: Record<string, string>) => {
    const store = new Map<string, string>();
    Object.entries(init ?? {}).forEach(([k, v]) =>
      store.set(k.toLowerCase(), v),
    );
    return {
      get: (key: string) => store.get(key.toLowerCase()) ?? null,
      set: (key: string, value: string) => store.set(key.toLowerCase(), value),
      delete: (key: string) => store.delete(key.toLowerCase()),
    };
  };
  const buildResponse = (
    status = 200,
    body?: unknown,
    headers?: Record<string, string>,
  ) => {
    const cookies = new Map<string, { name: string; value: string }>();
    return {
      status,
      body,
      headers: buildHeaders(headers),
      cookies: {
        set: (
          name: string | { name: string; value: string },
          value?: string,
        ) => {
          if (typeof name === 'object' && name !== null)
            return void cookies.set(name.name, {
              name: name.name,
              value: name.value,
            });
          cookies.set(name, { name, value: value ?? '' });
        },
        getAll: () => Array.from(cookies.values()),
        get: (name: string) => cookies.get(name),
      },
    };
  };
  class FakeNextRequest {
    url: string;
    nextUrl: URL;
    headers: { get: (key: string) => string | null };
    signal: AbortSignal;
    constructor(
      url: URL | string,
      init?: { headers?: Record<string, string> },
    ) {
      this.url = url.toString();
      this.nextUrl = new URL(this.url);
      const store = new Map<string, string>();
      Object.entries(init?.headers ?? {}).forEach(([k, v]) =>
        store.set(k.toLowerCase(), v),
      );
      this.headers = {
        get: (key: string) => store.get(key.toLowerCase()) ?? null,
      };
      this.signal = new AbortController().signal;
    }
  }
  return {
    NextResponse: {
      json: (
        body: unknown,
        init?: { status?: number; headers?: Record<string, string> },
      ) => buildResponse(init?.status ?? 200, body, init?.headers),
      next: () => buildResponse(200),
    },
    NextRequest: FakeNextRequest,
  };
});

type CookieLike = { name: string; value: string };
type CookieStoreLike = {
  getAll?: () => CookieLike[];
  set?: (cookie: CookieLike) => void;
};
type CookieCarrier = { cookies?: CookieStoreLike } | null | undefined;

type JsonCapableResponse = Response & {
  json?: () => unknown | Promise<unknown>;
};

function mergeResponseCookies(from: CookieCarrier, into: CookieCarrier) {
  from?.cookies?.getAll?.().forEach((cookie) => {
    into?.cookies?.set?.(cookie);
  });
}

async function parseUpstreamBody(res: Response) {
  const json = (res as JsonCapableResponse).json;
  if (typeof json !== 'function') return undefined;
  return json.call(res);
}

jest.mock('@/platform/server/bffAuth', () => ({
  requireBffAuth: jest.fn(),
  mergeResponseCookies,
}));

jest.mock('@/platform/server/bff', () => ({
  upstreamRequest: jest.fn(),
  parseUpstreamBody: jest.fn(parseUpstreamBody),
  getBackendBaseUrl: jest.fn(() => 'https://backend.test'),
  REQUEST_ID_HEADER: 'x-tenon-request-id',
  UPSTREAM_HEADER: 'x-tenon-upstream-status',
  resolveRequestId: jest.fn(() => 'req-123'),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/dashboard/route';

export const requireBffAuthMock = jest.requireMock('@/platform/server/bffAuth')
  .requireBffAuth as jest.Mock;
export const upstreamRequestMock = jest.requireMock('@/platform/server/bff')
  .upstreamRequest as jest.Mock;
export const parseUpstreamBodyMock = jest.requireMock('@/platform/server/bff')
  .parseUpstreamBody as jest.Mock;
export const getBackendBaseUrlMock = jest.requireMock('@/platform/server/bff')
  .getBackendBaseUrl as jest.Mock;
export const { BFF_HEADER } = jest.requireActual('@/app/api/bffRouteHelpers');

export const makeUpstreamResponse = (body: unknown, status = 200) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (key: string) =>
        key.toLowerCase() === 'content-type' ? 'application/json' : null,
    },
    json: async () => body,
  }) as unknown as Response;

export const resetDashboardRouteMocks = () => {
  jest.clearAllMocks();
  getBackendBaseUrlMock.mockReturnValue('https://backend.test');
};

export { GET, NextRequest, NextResponse };
