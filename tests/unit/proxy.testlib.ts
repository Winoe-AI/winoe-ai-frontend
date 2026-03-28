jest.mock('next/server', () => {
  const buildResponse = (status = 200, location?: string) => {
    const headerStore = new Map<string, string>();
    if (location) headerStore.set('location', location);
    const cookieStore = new Map<string, { name: string; value: string }>();
    return {
      status,
      headers: {
        get: (key: string) => headerStore.get(key) ?? null,
        set: (key: string, value: string) => headerStore.set(key, value),
      },
      cookies: {
        set: (
          name: string | { name: string; value: string },
          value?: string,
        ) =>
          typeof name === 'object' && name !== null
            ? cookieStore.set(name.name, { name: name.name, value: name.value })
            : cookieStore.set(name, { name, value: value ?? '' }),
        getAll: () => Array.from(cookieStore.values()),
      },
    };
  };

  return {
    NextResponse: {
      redirect: (url: URL | string) => buildResponse(307, url.toString()),
      next: () => buildResponse(200),
      json: (_body: unknown, init?: { status?: number }) =>
        buildResponse(init?.status ?? 200),
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      constructor(url: URL | string) {
        this.url = url.toString();
        this.nextUrl = new URL(this.url);
      }
    },
  };
});

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/platform/auth0', () => ({
  auth0: {
    middleware: jest.fn(() => NextResponse.next()),
    getSession: jest.fn(),
    getAccessToken: jest.fn(),
  },
  getSessionNormalized: jest.fn(),
}));
jest.mock('@/platform/auth/routing', () => {
  const actual = jest.requireActual('@/platform/auth/routing');
  return { ...actual, modeForPath: jest.fn(actual.modeForPath) };
});

export const mockAuth0 = jest.requireMock('@/platform/auth0').auth0 as {
  middleware: jest.Mock;
  getSession: jest.Mock;
  getAccessToken: jest.Mock;
};
export const getSessionNormalizedMock = jest.requireMock('@/platform/auth0')
  .getSessionNormalized as jest.Mock;
export const modeForPathMock = jest.requireMock('@/platform/auth/routing')
  .modeForPath as jest.Mock;
export const actualRouting = jest.requireActual('@/platform/auth/routing');
export const { proxy } = jest.requireActual('@/platform/middleware/proxy') as {
  proxy: (req: InstanceType<typeof NextRequest>) => Promise<unknown>;
};

export const resetProxyTestMocks = () => {
  jest.clearAllMocks();
  getSessionNormalizedMock.mockReset();
  modeForPathMock.mockImplementation(actualRouting.modeForPath);
  mockAuth0.getAccessToken.mockResolvedValue({ token: 'auth' });
};

export { NextRequest, NextResponse };
