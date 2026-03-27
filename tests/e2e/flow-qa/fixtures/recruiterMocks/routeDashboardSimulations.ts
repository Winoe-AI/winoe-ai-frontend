import { buildDefaultDetail } from './defaultsDetail';
import { decodePathSegment, fulfillJson } from './shared';
import type { RecruiterRouteContext } from './types';

export async function handleDashboardAndSimulationRoutes(
  ctx: RecruiterRouteContext,
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
        name: 'Recruiter QA',
        email: 'recruiter.qa@tenon.ai',
        role: 'recruiter',
      },
      simulations: data.simulations,
      profileError: null,
      simulationsError: null,
    });
    return true;
  }

  if (pathname === '/api/simulations' && method === 'GET') {
    await fulfillJson(route, data.simulations);
    return true;
  }

  if (pathname === '/api/simulations' && method === 'POST') {
    const payload = request.postDataJSON() as
      | Record<string, unknown>
      | undefined;
    data.simulations = [
      {
        id: data.createSimulationId,
        title: String(payload?.title ?? 'New simulation'),
        role: String(payload?.role ?? 'Backend Engineer'),
        createdAt: new Date().toISOString(),
        candidateCount: 0,
        templateKey: String(payload?.templateKey ?? 'backend_api'),
      },
      ...data.simulations,
    ];
    await fulfillJson(route, { id: data.createSimulationId, status: 201 }, 201);
    return true;
  }

  const simulationDetailMatch = pathname.match(/^\/api\/simulations\/([^/]+)$/);
  if (simulationDetailMatch && method === 'GET') {
    await fulfillJson(
      route,
      buildDefaultDetail(decodePathSegment(simulationDetailMatch[1])),
    );
    return true;
  }

  if (
    /^\/api\/simulations\/([^/]+)\/candidates$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.candidates);
    return true;
  }

  if (
    /^\/api\/simulations\/([^/]+)\/candidates\/compare$/.test(pathname) &&
    method === 'GET'
  ) {
    await fulfillJson(route, data.compareRows);
    return true;
  }

  return false;
}
