import { NextRequest } from 'next/server';
import { withTalentPartnerAuth } from '@/app/api/bffRouteHelpers';
import { handleDashboard } from '@/features/talent-partner/api/dashboard/handlerApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  return withTalentPartnerAuth(
    req,
    { tag: 'dashboard', requirePermission: 'talent_partner:access' },
    (auth) => handleDashboard(req, auth),
  );
}
