import { fulfillJson } from './shared';
import type { TalentPartnerRouteContext } from './types';

export async function handleWinoeReportRoutes(
  ctx: TalentPartnerRouteContext,
): Promise<boolean> {
  const { route, method, pathname, data } = ctx;

  if (
    /^\/api\/candidate_sessions\/([^/]+)\/winoe_report$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.winoeReportPayload);
    return true;
  }

  if (
    /^\/api\/candidate_sessions\/([^/]+)\/winoe_report\/generate$/.test(
      pathname,
    ) &&
    method === 'POST'
  ) {
    await fulfillJson(route, { jobId: 'fit-job-1', status: 'queued' }, 202);
    return true;
  }

  return false;
}
