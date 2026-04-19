import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; scenarioVersionId: string }> },
) {
  const { id, scenarioVersionId } = await context.params;

  return withTalentPartnerAuth(
    req,
    { tag: 'approve-scenario', requirePermission: 'talent_partner:access' },
    async (auth) =>
      forwardJson({
        path: `/api/trials/${encodeURIComponent(id)}/scenario/${encodeURIComponent(scenarioVersionId)}/approve`,
        method: 'POST',
        cache: 'no-store',
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
