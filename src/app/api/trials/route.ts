import { NextRequest, NextResponse } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { LONG_PROXY_TIMEOUT_MS } from '@/platform/server/backendProxy/constants';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  return withTalentPartnerAuth(
    req,
    { tag: 'trials-list', requirePermission: 'talent_partner:access' },
    async (auth) =>
      forwardJson({
        path: '/api/trials',
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}

export async function POST(req: NextRequest) {
  return withTalentPartnerAuth(
    req,
    { tag: 'trials-create', requirePermission: 'talent_partner:access' },
    async (auth) => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
      }

      return forwardJson({
        path: '/api/trials',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
        timeoutMs: LONG_PROXY_TIMEOUT_MS,
        maxTotalTimeMs: LONG_PROXY_TIMEOUT_MS,
      });
    },
  );
}
