import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  return withTalentPartnerAuth(
    req,
    {
      tag: 'benchmarks',
      requirePermission: 'talent_partner:access',
    },
    async (auth) =>
      forwardJson({
        path: `/api/v1/benchmarks${search ? `?${search}` : ''}`,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
