import { cache } from 'react';
import { getAccessToken, getSessionNormalized } from '@/platform/auth0';
import { extractPermissions, hasPermission } from '@/platform/auth0/claims';
import {
  generateRequestId,
  getBackendBaseUrl,
  parseUpstreamBody,
  upstreamRequest,
} from '@/platform/server/bff';
import type { TalentPartnerProfile } from '@/features/talent-partner/types';

type TalentPartnerSessionProfile = {
  canTalentPartner: boolean;
  profile: TalentPartnerProfile | null;
  session: Awaited<ReturnType<typeof getSessionNormalized>>;
};

export const getCachedTalentPartnerSessionProfile = cache(
  async (): Promise<TalentPartnerSessionProfile> => {
    const session = await getSessionNormalized();
    if (!session?.user) {
      return { canTalentPartner: false, profile: null, session };
    }

    const permissions = extractPermissions(
      session.user,
      (session as { accessToken?: string | null }).accessToken ?? null,
    );
    const canTalentPartner = hasPermission(
      permissions,
      'talent_partner:access',
    );
    if (!canTalentPartner) {
      return { canTalentPartner, profile: null, session };
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
        return { canTalentPartner, profile: null, session };
      }
      const profile = (await parseUpstreamBody(
        response,
      )) as TalentPartnerProfile | null;
      return { canTalentPartner, profile, session };
    } catch {
      return { canTalentPartner, profile: null, session };
    }
  },
);
