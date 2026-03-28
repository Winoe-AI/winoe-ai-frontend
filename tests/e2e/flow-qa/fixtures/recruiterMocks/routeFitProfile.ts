import { fulfillJson } from './shared';
import type { RecruiterRouteContext } from './types';

export async function handleFitProfileRoutes(
  ctx: RecruiterRouteContext,
): Promise<boolean> {
  const { route, method, pathname, data } = ctx;

  if (
    /^\/api\/candidate_sessions\/([^/]+)\/fit_profile$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.fitProfilePayload);
    return true;
  }

  if (
    /^\/api\/candidate_sessions\/([^/]+)\/fit_profile\/generate$/.test(
      pathname,
    ) &&
    method === 'POST'
  ) {
    await fulfillJson(route, { jobId: 'fit-job-1', status: 'queued' }, 202);
    return true;
  }

  return false;
}
