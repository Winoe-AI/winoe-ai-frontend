import { NextRequest, NextResponse } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  return withTalentPartnerAuth(
    req,
    { tag: 'company-ai-config', requirePermission: 'talent_partner:access' },
    async (auth) =>
      forwardJson({
        path: '/api/companies/me/ai-config',
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}

export async function PUT(req: NextRequest) {
  return withTalentPartnerAuth(
    req,
    {
      tag: 'company-ai-config-update',
      requirePermission: 'talent_partner:access',
    },
    async (auth) => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
      }

      return forwardJson({
        path: '/api/companies/me/ai-config',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      });
    },
  );
}
