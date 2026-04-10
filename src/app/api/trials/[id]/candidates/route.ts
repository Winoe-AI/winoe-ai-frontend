import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withTalentPartnerAuth(
    req,
    { tag: 'trials-candidates', requirePermission: 'talent_partner:access' },
    async (auth) =>
      forwardJson({
        path: `/api/trials/${encodeURIComponent(id)}/candidates`,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
