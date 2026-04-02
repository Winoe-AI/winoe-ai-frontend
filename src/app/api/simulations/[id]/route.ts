import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withRecruiterAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withRecruiterAuth(
    req,
    { tag: 'simulations-detail', requirePermission: 'recruiter:access' },
    async (auth) =>
      forwardJson({
        path: `/api/simulations/${encodeURIComponent(id)}`,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  return withRecruiterAuth(
    req,
    { tag: 'simulations-update', requirePermission: 'recruiter:access' },
    async (auth) =>
      forwardJson({
        path: `/api/simulations/${encodeURIComponent(id)}`,
        method: 'PUT',
        cache: 'no-store',
        ...(body === null ? {} : { body }),
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
