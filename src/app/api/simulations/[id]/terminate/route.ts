import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withRecruiterAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  return withRecruiterAuth(
    req,
    { tag: 'terminate', requirePermission: 'recruiter:access' },
    async (auth) =>
      forwardJson({
        path: `/api/simulations/${encodeURIComponent(id)}/terminate`,
        method: 'POST',
        cache: 'no-store',
        ...(body === null ? {} : { body }),
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
