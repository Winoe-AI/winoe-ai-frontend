import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
const INVITE_REQUEST_TIMEOUT_MS = 90_000;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  return withTalentPartnerAuth(
    req,
    { tag: 'invite', requirePermission: 'talent_partner:access' },
    async (auth) => {
      const payload: unknown = await req.json().catch(() => undefined);
      return forwardJson({
        path: `/api/trials/${encodeURIComponent(id)}/invite`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ?? {},
        accessToken: auth.accessToken,
        requestId: auth.requestId,
        timeoutMs: INVITE_REQUEST_TIMEOUT_MS,
      });
    },
  );
}
