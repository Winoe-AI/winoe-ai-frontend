import { NextRequest, NextResponse } from 'next/server';
import { mergeResponseCookies, requireBffAuth } from '@/lib/server/bffAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function isLocalEnvironment() {
  const vercelEnv = (process.env.VERCEL_ENV ?? '').toLowerCase();
  if (vercelEnv) return vercelEnv === 'development';
  return process.env.NODE_ENV !== 'production';
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'test') {
    const auth = await requireBffAuth(req);
    if (!auth.ok) {
      mergeResponseCookies(auth.cookies, auth.response);
      return auth.response;
    }
    const resp = NextResponse.json({ accessToken: auth.accessToken });
    mergeResponseCookies(auth.cookies, resp);
    return resp;
  }

  if (!isLocalEnvironment()) {
    // eslint-disable-next-line no-console
    console.warn('[security] /api/dev/access-token is disabled outside local');
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    { message: 'This endpoint has been disabled.' },
    { status: 410 },
  );
}
