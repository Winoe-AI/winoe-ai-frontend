import { NextRequest } from 'next/server';
import { forwardJson } from '@/platform/server/bff';
import { withRecruiterAuth } from '@/app/api/bffRouteHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withRecruiterAuth(
    req,
    { tag: 'auth-recruiter-onboarding', requirePermission: 'recruiter:access' },
    async (auth) =>
      forwardJson({
        path: '/api/auth/recruiter-onboarding',
        method: 'POST',
        body,
        accessToken: auth.accessToken,
        requestId: auth.requestId,
      }),
  );
}
