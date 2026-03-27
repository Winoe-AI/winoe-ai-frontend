import { TextDecoder, TextEncoder } from 'util';

jest.mock('next/server', () => {
  const { MockNextRequest, MockNextResponse } = jest.requireActual(
    './backendProxyRoute.mockNext',
  );
  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

jest.mock('@/platform/server/bff', () => {
  const REQUEST_ID_HEADER = 'x-tenon-request-id';
  const parseUpstreamBody = jest.fn(async (res: Response) => {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch {
        return undefined;
      }
    }
    try {
      return await res.text();
    } catch {
      return undefined;
    }
  });
  const upstreamRequest = jest.fn(
    async (options: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: BodyInit | null;
      cache?: RequestCache;
      timeoutMs?: number;
      requestId: string;
      maxAttempts?: number;
    }) => {
      const method = (options.method ?? 'GET').toUpperCase();
      const retryable = method === 'GET' || method === 'HEAD';
      const attempts = retryable ? (options.maxAttempts ?? 3) : 1;
      let lastError: unknown;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const controller = new AbortController();
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, options.timeoutMs ?? 15000);
        const headers = {
          ...(options.headers ?? {}),
          [REQUEST_ID_HEADER]: options.requestId,
        };
        try {
          const resp = await fetch(options.url, {
            method,
            headers,
            body: options.body,
            cache: options.cache ?? 'no-store',
            redirect: 'manual',
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (
            retryable &&
            attempt < attempts &&
            [502, 503, 504].includes(resp.status)
          ) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            continue;
          }
          return resp;
        } catch (err) {
          clearTimeout(timeout);
          if (timedOut)
            throw new Error(
              `Request timed out after ${options.timeoutMs ?? 15000}ms`,
            );
          if (!retryable || attempt >= attempts) throw err;
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
      throw lastError ?? new Error('Upstream failed');
    },
  );
  return {
    getBackendBaseUrl: jest.fn(() => 'https://backend.test'),
    parseUpstreamBody,
    resolveRequestId: jest.fn(() => 'req-test'),
    UPSTREAM_HEADER: 'x-tenon-upstream-status',
    REQUEST_ID_HEADER,
    upstreamRequest,
  };
});

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/backend/[...path]/route';

export type FakeResponseShape = {
  body: unknown;
  status: number;
  headers: { get: (key: string) => string | null };
};

export const fetchMock = jest.fn();
const originalFetch = global.fetch;
export const encoder = new TextEncoder();
export const upstreamRequestMock = jest.requireMock('@/platform/server/bff')
  .upstreamRequest as jest.Mock;
export const parseUpstreamBodyMock = jest.requireMock('@/platform/server/bff')
  .parseUpstreamBody as jest.Mock;

export function mockResponse(
  body: string | ArrayBuffer,
  init: { status: number; headers?: Record<string, string> },
) {
  const headerStore = new Map<string, string>();
  Object.entries(init.headers ?? {}).forEach(([k, v]) =>
    headerStore.set(k.toLowerCase(), v),
  );
  return {
    status: init.status,
    headers: {
      get: (key: string) => headerStore.get(key.toLowerCase()) ?? null,
      forEach: (cb: (value: string, key: string) => void) =>
        headerStore.forEach((v, k) => cb(v, k)),
    },
    async json() {
      const text =
        typeof body === 'string'
          ? body
          : new TextDecoder().decode(body as ArrayBuffer);
      return JSON.parse(text);
    },
    async text() {
      return typeof body === 'string'
        ? body
        : new TextDecoder().decode(body as ArrayBuffer);
    },
    async arrayBuffer() {
      return typeof body === 'string'
        ? encoder.encode(body).buffer
        : (body as ArrayBuffer);
    },
  };
}

export const setupBackendProxyRouteTest = () => {
  jest.clearAllMocks();
  global.fetch = fetchMock as unknown as typeof fetch;
};
export const teardownBackendProxyRouteTest = () => {
  fetchMock.mockReset();
  jest.useRealTimers();
};
export const restoreBackendProxyRouteTest = () => {
  global.fetch = originalFetch;
};

export { NextRequest, GET, POST };
