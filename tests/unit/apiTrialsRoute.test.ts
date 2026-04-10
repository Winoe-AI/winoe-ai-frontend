jest.mock('next/server', () => {
  const buildResponse = (
    status = 200,
    body?: unknown,
    headers?: Record<string, string>,
  ) => {
    const cookies = new Map<string, { name: string; value: string }>();
    const headerStore = new Map<string, string>(
      Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
    return {
      status,
      body,
      headers: {
        get: (key: string) => headerStore.get(key.toLowerCase()) ?? null,
        set: (key: string, value: string) =>
          headerStore.set(key.toLowerCase(), value),
        delete: (key: string) => headerStore.delete(key.toLowerCase()),
      },
      cookies: {
        set: (
          name: string | { name: string; value: string },
          value?: string,
        ) => {
          if (typeof name === 'object' && name !== null)
            cookies.set(name.name, { name: name.name, value: name.value });
          else cookies.set(name, { name, value: value ?? '' });
        },
        getAll: () => Array.from(cookies.values()),
        get: (name: string) => cookies.get(name),
      },
    };
  };

  return {
    NextResponse: {
      json: (
        body: unknown,
        init?: { status?: number; headers?: Record<string, string> },
      ) =>
        buildResponse(init?.status ?? 200, body, {
          'content-type': 'application/json',
          ...(init?.headers ?? {}),
        }),
      next: () => buildResponse(200),
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      headers: { get: (key: string) => string | null };
      constructor(url: URL | string, headers?: Record<string, string>) {
        this.url = url.toString();
        this.nextUrl = new URL(this.url);
        const headerStore = new Map<string, string>(
          Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
        );
        this.headers = {
          get: (key: string) => headerStore.get(key.toLowerCase()) ?? null,
        };
      }
      async json() {
        return {};
      }
    },
  };
});

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/trials/route';

jest.mock('@/platform/server/bffAuth', () => ({
  requireBffAuth: jest.fn(),
  mergeResponseCookies: (
    from: {
      cookies?: { getAll?: () => Array<{ name: string; value: string }> };
    },
    into: {
      cookies?: { set?: (cookie: { name: string; value: string }) => void };
    },
  ) => {
    if (!from?.cookies?.getAll || !into?.cookies?.set) return;
    from.cookies
      .getAll()
      .forEach((cookie: { name: string; value: string }) =>
        into.cookies?.set?.(cookie),
      );
  },
}));

jest.mock('@/platform/server/bff', () => ({
  forwardJson: jest.fn(),
  resolveRequestId: jest.fn(() => 'req-123'),
  REQUEST_ID_HEADER: 'x-winoe-request-id',
}));

const requireBffAuthMock = jest.requireMock('@/platform/server/bffAuth')
  .requireBffAuth as jest.Mock;
const forwardJsonMock = jest.requireMock('@/platform/server/bff')
  .forwardJson as jest.Mock;
const { BFF_HEADER } = jest.requireActual('@/app/api/bffRouteHelpers');

describe('/api/trials route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('merges cookies and returns upstream status for POST', async () => {
    const cookies = NextResponse.next();
    cookies.cookies.set('edge', 'merged');
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'tok',
      permissions: ['talent_partner:access'],
      session: {},
      cookies,
    });
    forwardJsonMock.mockResolvedValue(
      NextResponse.json({ id: 'sim_123' }, { status: 201 }),
    );

    const req = new NextRequest(new URL('http://localhost/api/trials'));
    const res = await POST(req as never);

    expect(res.status).toBe(201);
    expect(res.cookies.get('edge')?.value).toBe('merged');
    expect(res.headers.get(BFF_HEADER)).toBe('trials-create');
    expect(requireBffAuthMock).toHaveBeenCalledWith(req, {
      requirePermission: 'talent_partner:access',
    });
  });
});
