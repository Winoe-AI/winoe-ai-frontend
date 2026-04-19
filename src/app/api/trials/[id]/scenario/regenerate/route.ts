import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  return withTalentPartnerAuth(
    req,
    { tag: 'regenerate-scenario', requirePermission: 'talent_partner:access' },
    async (auth) =>
      forwardJson({
        path: `/api/trials/${encodeURIComponent(id)}/scenario/regenerate`,
        method: 'POST',
        cache: 'no-store',
        body,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
