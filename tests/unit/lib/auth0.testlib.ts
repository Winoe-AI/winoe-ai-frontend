const originalEnv = { ...process.env };

jest.mock('next/server', () => {
  const buildResponse = (status = 200, location?: string) => {
    const headers = new Map<string, string>();
    if (location) headers.set('location', location);
    const cookies = new Map<string, { name: string; value: string }>();
    return {
      status,
      headers: { get: (k: string) => headers.get(k) ?? null, set: (k: string, v: string) => headers.set(k, v), delete: (k: string) => headers.delete(k) },
      cookies: { set: (name: string | { name: string; value: string }, value?: string) => typeof name === 'object' ? void cookies.set(name.name, { name: name.name, value: name.value }) : void cookies.set(name, { name, value: value ?? '' }), getAll: () => Array.from(cookies.values()) },
    };
  };
  return {
    NextResponse: { redirect: (url: URL | string) => buildResponse(307, url.toString()), json: (_body: unknown, init?: { status?: number }) => buildResponse(init?.status ?? 200), next: () => buildResponse(200) },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      constructor(url: string) {
        this.url = url;
        this.nextUrl = new URL(url);
      }
    },
  };
});

import { NextResponse } from 'next/server';

export const mockAuth0Instance = { middleware: jest.fn(async () => NextResponse.next()), getSession: jest.fn(), getAccessToken: jest.fn() };
export const Auth0ClientMock = jest.fn((config: unknown) => {
  void config;
  return mockAuth0Instance;
});

jest.mock('@auth0/nextjs-auth0/server', () => ({ Auth0Client: Auth0ClientMock }));
jest.mock('@/lib/auth0-claims', () => {
  const actual = jest.requireActual('@/lib/auth0-claims');
  return { ...actual, normalizeUserClaims: (user: Record<string, unknown>) => ({ ...user, normalized: true }), extractPermissions: actual.extractPermissions };
});

export const sanitizeReturnToMock = jest.fn((v?: string | null) => v ?? '/');
export const modeForPathMock = jest.fn((path?: string | null) => {
  void path;
  return 'candidate';
});
jest.mock('@/lib/auth/routing', () => {
  const actual = jest.requireActual('@/lib/auth/routing');
  return {
    ...actual,
    sanitizeReturnTo: (v?: string | null) => sanitizeReturnToMock(v),
    modeForPath: (path?: string | null) => modeForPathMock(path),
  };
});

export async function importAuth0() {
  return import('@/lib/auth0');
}

export const getAuth0Config = () => {
  const config = Auth0ClientMock.mock.calls[0]?.[0];
  if (!config) throw new Error('Auth0 client was not initialized');
  return config as {
    beforeSessionSaved: (session: unknown, token: string) => unknown;
    onCallback: (...args: unknown[]) => unknown;
    authorizationParameters?: Record<string, unknown>;
  };
};

export function resetAuth0TestEnv() {
  jest.resetModules();
  jest.clearAllMocks();
  Object.assign(process.env, originalEnv, {
    TENON_AUTH0_SECRET: 's',
    TENON_AUTH0_DOMAIN: 'd',
    TENON_AUTH0_CLIENT_ID: 'cid',
    TENON_AUTH0_CLIENT_SECRET: 'cs',
    TENON_APP_BASE_URL: 'http://localhost:3000',
  });
}

export function restoreAuth0TestEnv() {
  Object.assign(process.env, originalEnv);
}
