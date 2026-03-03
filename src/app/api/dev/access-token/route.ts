import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isLocalEnvironment } from '@/app/api/accessTokenRouteEnvironment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export function GET(_req: NextRequest) {
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
