import { cache } from 'react';
import { getAccessToken, getSessionNormalized } from '@/platform/auth0';
import { extractPermissions, hasPermission } from '@/platform/auth0/claims';
import {
  generateRequestId,
  getBackendBaseUrl,
  parseUpstreamBody,
  upstreamRequest,
} from '@/platform/server/bff';
import type { RecruiterProfile } from '@/features/recruiter/types';

type RecruiterSessionProfile = {
  canRecruiter: boolean;
  profile: RecruiterProfile | null;
  session: Awaited<ReturnType<typeof getSessionNormalized>>;
};

export const getCachedRecruiterSessionProfile = cache(
  async (): Promise<RecruiterSessionProfile> => {
    const session = await getSessionNormalized();
    if (!session?.user) {
      return { canRecruiter: false, profile: null, session };
    }

    const permissions = extractPermissions(
      session.user,
      (session as { accessToken?: string | null }).accessToken ?? null,
    );
    const canRecruiter = hasPermission(permissions, 'recruiter:access');
    if (!canRecruiter) {
      return { canRecruiter, profile: null, session };
    }

    try {
      const accessToken = await getAccessToken();
      const response = await upstreamRequest({
        url: `${getBackendBaseUrl()}/api/auth/me`,
        headers: { Authorization: `Bearer ${accessToken}` },
        requestId: generateRequestId(),
        cache: 'no-store',
        maxTotalTimeMs: 15000,
      });
      if (!response.ok) {
        return { canRecruiter, profile: null, session };
      }
      const profile = (await parseUpstreamBody(response)) as RecruiterProfile | null;
      return { canRecruiter, profile, session };
    } catch {
      return { canRecruiter, profile: null, session };
    }
  },
);
