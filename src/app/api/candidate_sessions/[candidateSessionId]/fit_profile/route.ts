import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withRecruiterAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ candidateSessionId: string }> },
) {
  const { candidateSessionId } = await context.params;

  return withRecruiterAuth(
    req,
    { tag: 'fit-profile-get', requirePermission: 'recruiter:access' },
    async (auth) =>
      forwardJson({
        path: `/api/candidate_sessions/${encodeURIComponent(candidateSessionId)}/fit_profile`,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
