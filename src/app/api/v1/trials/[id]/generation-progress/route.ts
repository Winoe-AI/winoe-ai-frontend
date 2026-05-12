import { NextRequest, NextResponse } from 'next/server';
import { REQUEST_ID_HEADER } from '@/platform/server/bff';
import { getBackendBaseUrl } from '@/platform/server/bff/upstream';
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
    {
      tag: 'trials-generation-sse',
      requirePermission: 'talent_partner:access',
    },
    async (auth) => {
      const backendUrl = `${getBackendBaseUrl()}/api/v1/trials/${encodeURIComponent(id)}/generation-progress`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${auth.accessToken}`,
      };
      const email = auth.session?.user?.email;
      if (typeof email === 'string' && email.trim()) {
        headers['x-dev-user-email'] = email.trim();
      }

      const upstream = await fetch(backendUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!upstream.ok || !upstream.body) {
        return NextResponse.json(
          { message: 'Unable to open drafting progress stream.' },
          { status: upstream.status >= 400 ? upstream.status : 502 },
        );
      }

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          [REQUEST_ID_HEADER]: auth.requestId,
        },
      });
    },
  );
}
