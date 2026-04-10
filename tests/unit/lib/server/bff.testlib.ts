import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, WritableStream } from 'stream/web';

global.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
global.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
global.ReadableStream =
  ReadableStream as unknown as typeof globalThis.ReadableStream;
global.WritableStream =
  WritableStream as unknown as typeof globalThis.WritableStream;

jest.mock('next/server', () => {
  class LocalResponse {
    status: number;
    ok: boolean;
    headers: {
      get: (name: string) => string | null;
      set: (name: string, value: string) => void;
      delete: () => void;
    };
    #body: unknown;
    constructor(body: unknown = '', init?: ResponseInit) {
      this.#body = body;
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
      const rawHeaders = init?.headers ?? {};
      this.headers = {
        get: (name: string) =>
          rawHeaders[name.toLowerCase() as never] ??
          rawHeaders[name as never] ??
          null,
        set: (name: string, value: string) => {
          rawHeaders[name.toLowerCase() as never] = value as never;
        },
        delete: () => undefined,
      };
    }
    async json() {
      return typeof this.#body === 'string'
        ? JSON.parse(this.#body || 'null')
        : this.#body;
    }
    async text() {
      return typeof this.#body === 'string'
        ? this.#body
        : JSON.stringify(this.#body);
    }
  }
  if (typeof global.Response === 'undefined')
    global.Response = LocalResponse as unknown as typeof global.Response;
  class MockNextResponse extends LocalResponse {
    static json(body: unknown, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(body ?? null), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    }
  }
  return { NextResponse: MockNextResponse };
});

jest.mock('@/platform/auth0', () => ({
  auth0: { getSession: jest.fn() },
  getAccessToken: jest.fn(),
  getSessionNormalized: jest.fn(),
}));

import { NextResponse } from 'next/server';
import {
  ensureAccessToken,
  forwardJson,
  getBackendBaseUrl,
  parseUpstreamBody,
} from '@/platform/server/bff';

export {
  NextResponse,
  ensureAccessToken,
  forwardJson,
  getBackendBaseUrl,
  parseUpstreamBody,
};
export const { getAccessToken, getSessionNormalized } = jest.requireMock(
  '@/platform/auth0',
) as {
  getAccessToken: jest.Mock;
  getSessionNormalized: jest.Mock;
};

const originalBackendBase = process.env.WINOE_BACKEND_BASE_URL;

export const resetBffTestState = () => {
  jest.resetAllMocks();
  process.env.WINOE_BACKEND_BASE_URL = 'http://api.test';
};

export const restoreBffEnv = () => {
  process.env.WINOE_BACKEND_BASE_URL = originalBackendBase;
};
