import { NextRequest, NextResponse } from 'next/server';

export type ProxyAuthResult =
  | { ok: true; accessToken: string; cookies: NextResponse | null }
  | { ok: false; response: NextResponse; cookies: NextResponse | null };

export function mergeAuthCookies(
  from: NextResponse | null | undefined,
  into: NextResponse,
) {
  if (!from) return;
  from.cookies.getAll().forEach((cookie) => {
    into.cookies.set(cookie);
  });
}

export async function requireProxyAuth(
  req: NextRequest,
): Promise<ProxyAuthResult> {
  if (process.env.NODE_ENV === 'test') {
    const authHeader = req.headers.get('authorization') ?? '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return {
      ok: true,
      accessToken: match?.[1] ?? 'test-access-token',
      cookies: null,
    };
  }

  const { requireBffAuth } = await import('@/lib/server/bffAuth');
  return requireBffAuth(req);
}
