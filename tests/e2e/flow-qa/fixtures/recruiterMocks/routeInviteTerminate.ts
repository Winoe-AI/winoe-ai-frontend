import { fulfillJson } from './shared';
import type { RecruiterRouteContext } from './types';

export async function handleInviteAndTerminateRoutes(
  ctx: RecruiterRouteContext,
): Promise<boolean> {
  const { route, request, method, pathname, state } = ctx;

  if (
    /^\/api\/simulations\/([^/]+)\/invite$/.test(pathname) &&
    method === 'POST'
  ) {
    state.inviteRequestCount += 1;
    const payload = request.postDataJSON() as
      | Record<string, unknown>
      | undefined;
    await fulfillJson(
      route,
      {
        candidateSessionId: state.candidateSessionId,
        token: `candidate-token-${state.candidateSessionId}`,
        inviteUrl: `http://127.0.0.1:3200/candidate/session/candidate-token-${state.candidateSessionId}`,
        outcome: state.inviteRequestCount === 1 ? 'created' : 'resent',
        candidateName: payload?.candidateName,
        inviteEmail: payload?.inviteEmail,
      },
      201,
    );
    return true;
  }

  if (
    /^\/api\/simulations\/([^/]+)\/candidates\/([^/]+)\/invite\/resend$/.test(
      pathname,
    ) &&
    method === 'POST'
  ) {
    state.resendInviteCount += 1;
    await fulfillJson(route, {
      retryAfterSeconds: 30,
      inviteEmailStatus: 'sent',
    });
    return true;
  }

  if (
    /^\/api\/simulations\/([^/]+)\/terminate$/.test(pathname) &&
    method === 'POST'
  ) {
    await fulfillJson(route, {
      status: 'queued',
      cleanupJobIds: ['cleanup-job-1'],
    });
    return true;
  }

  return false;
}
