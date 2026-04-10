import { fulfillJson } from './shared';
import type { TalentPartnerRouteContext } from './types';

export async function handleSubmissionsRoutes(
  ctx: TalentPartnerRouteContext,
): Promise<boolean> {
  const { route, method, pathname, data } = ctx;

  if (pathname === '/api/submissions' && method === 'GET') {
    await fulfillJson(route, { items: data.submissions });
    return true;
  }

  const submissionMatch = pathname.match(/^\/api\/submissions\/(\d+)$/);
  if (submissionMatch && method === 'GET') {
    const id = Number(submissionMatch[1]);
    const artifact = data.artifacts[id];
    if (artifact) {
      await fulfillJson(route, artifact);
      return true;
    }
    await fulfillJson(route, { message: 'Submission not found' }, 404);
    return true;
  }

  return false;
}
