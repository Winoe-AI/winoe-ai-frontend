import { buildDefaultDetail } from './defaultsDetail';
import { decodePathSegment, fulfillJson } from './shared';
import type { TalentPartnerRouteContext } from './types';

export async function handleDashboardAndTrialRoutes(
  ctx: TalentPartnerRouteContext,
): Promise<boolean> {
  const { route, request, method, pathname, options, data } = ctx;

  if (pathname === '/api/dashboard' && method === 'GET') {
    if (options.dashboardDelayMs && options.dashboardDelayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, options.dashboardDelayMs),
      );
    }
    await fulfillJson(route, {
      profile: {
        name: 'TalentPartner QA',
        email: 'talent_partner.qa@winoe.ai',
        role: 'talent_partner',
      },
      trials: data.trials,
      profileError: null,
      trialsError: null,
    });
    return true;
  }

  if (pathname === '/api/trials' && method === 'GET') {
    await fulfillJson(route, data.trials);
    return true;
  }

  if (pathname === '/api/trials' && method === 'POST') {
    const payload = request.postDataJSON() as
      | Record<string, unknown>
      | undefined;
    data.trials = [
      {
        id: data.createTrialId,
        title: String(payload?.title ?? 'New trial'),
        role: String(payload?.role ?? 'Backend Engineer'),
        createdAt: new Date().toISOString(),
        candidateCount: 0,
        templateKey: String(payload?.templateKey ?? 'backend_api'),
      },
      ...data.trials,
    ];
    await fulfillJson(route, { id: data.createTrialId, status: 201 }, 201);
    return true;
  }

  const trialDetailMatch = pathname.match(/^\/api\/trials\/([^/]+)$/);
  if (trialDetailMatch && method === 'GET') {
    await fulfillJson(
      route,
      buildDefaultDetail(decodePathSegment(trialDetailMatch[1])),
    );
    return true;
  }

  if (
    /^\/api\/trials\/([^/]+)\/candidates$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.candidates);
    return true;
  }

  if (
    /^\/api\/trials\/([^/]+)\/candidates\/compare$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.compareRows);
    return true;
  }

  return false;
}
