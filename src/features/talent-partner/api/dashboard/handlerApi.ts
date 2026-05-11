import { NextResponse } from 'next/server';
import {
  REQUEST_ID_HEADER,
  UPSTREAM_HEADER,
  getBackendBaseUrl,
} from '@/platform/server/bff';
import type {
  TalentPartnerProfile,
  TrialListItem,
} from '@/features/talent-partner/types';
import { fetchProfile } from './profileApi';
import { fetchTrials } from './trialsApi';
import {
  fallbackProfile,
  fallbackTrials,
  settled,
  toWorstStatus,
  totalRetries,
} from './dashboardHelpersApi';

type DashboardAuthContext = {
  accessToken: string;
  requestId: string;
  session?: { user?: { email?: string | null } } | null;
};

function buildUpstreamAuthHeaders(
  auth: DashboardAuthContext,
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
  };
  const fromSession = auth.session?.user?.email?.trim();
  const fromToken =
    auth.accessToken.includes(':') &&
    auth.accessToken.startsWith('talent_partner:')
      ? auth.accessToken.slice(auth.accessToken.indexOf(':') + 1).trim()
      : '';
  const devEmail = fromSession || fromToken;
  if (devEmail) {
    headers['x-dev-user-email'] = devEmail.toLowerCase();
  }
  return headers;
}

export async function handleDashboard(
  req: Request,
  auth: DashboardAuthContext,
): Promise<NextResponse> {
  const routeStart = Date.now();
  const backendBase = getBackendBaseUrl();
  const authHeaders = buildUpstreamAuthHeaders(auth);

  const [profileOutcome, trialsOutcome] = await Promise.allSettled([
    fetchProfile({
      backendBase,
      headers: authHeaders,
      requestId: auth.requestId,
      signal: req.signal,
    }),
    fetchTrials({
      backendBase,
      headers: authHeaders,
      requestId: auth.requestId,
      signal: req.signal,
    }),
  ]);

  const profileResult = settled(profileOutcome, fallbackProfile);
  const trialsResult = settled(trialsOutcome, fallbackTrials);

  if (profileResult.response) return profileResult.response;
  if (trialsResult.response) return trialsResult.response;

  const worstStatus = toWorstStatus([
    profileResult.status,
    trialsResult.status,
  ]);

  const payload = {
    profile: profileResult.profile,
    trials: trialsResult.trials,
    profileError: profileResult.error,
    trialsError: trialsResult.error,
  } satisfies {
    profile: TalentPartnerProfile | null;
    trials: TrialListItem[];
    profileError: string | null;
    trialsError: string | null;
  };

  const response = NextResponse.json(payload, {
    status: 200,
    headers: {
      [UPSTREAM_HEADER]: String(worstStatus),
      [REQUEST_ID_HEADER]: auth.requestId,
      'x-winoe-upstream-status-profile': String(profileResult.status ?? ''),
      'x-winoe-upstream-status-trials': String(trialsResult.status ?? ''),
    },
  });

  response.headers.delete('location');

  const retryCount = totalRetries(
    profileResult.meta?.attempts,
    trialsResult.meta?.attempts,
  );
  response.headers.set(
    'Server-Timing',
    `bff;dur=${Date.now() - routeStart}, retry;desc="count=${retryCount}"`,
  );

  return response;
}
