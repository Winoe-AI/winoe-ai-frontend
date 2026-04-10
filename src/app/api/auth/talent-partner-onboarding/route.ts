import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withTalentPartnerAuth(
    req,
    {
      tag: 'auth-talent-partner-onboarding',
      requirePermission: 'talent_partner:access',
    },
    async (auth) =>
      forwardJson({
        path: '/api/auth/talent-partner-onboarding',
        method: 'POST',
        body,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
