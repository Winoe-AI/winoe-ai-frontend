import type { NextRequest, NextResponse } from 'next/server';
import {
  normalizeAccessToken,
  redirect,
  redirectNotAuthorized,
  requiresCandidateAccess,
  requiresTalentPartnerAccess,
} from '@/platform/auth/proxyUtils';
import { extractPermissions, hasPermission } from '@/platform/auth0/claims';
import type { Claims } from '@/platform/auth/claimsDecode';

export const redirectSignedInHome = (
  session: unknown,
  isRootOrLogin: boolean,
  request: NextRequest,
): NextResponse | null => {
  if (!session || !isRootOrLogin) return null;
  const accessToken = normalizeAccessToken(
    (session as { accessToken?: unknown }).accessToken,
  );
  const permissions = extractPermissions(
    (session as { user?: unknown }).user as Claims | null | undefined,
    accessToken,
  );
  if (hasPermission(permissions, 'talent_partner:access'))
    return redirect('/dashboard', request);
  if (hasPermission(permissions, 'candidate:access'))
    return redirect('/candidate/dashboard', request);
  return null;
};

export const gateByRole = (
  pathname: string,
  permissions: string[],
  request: NextRequest,
) => {
  const wantsTalentPartner = requiresTalentPartnerAccess(pathname);
  const wantsCandidate = requiresCandidateAccess(pathname);
  const hasTalentPartner = hasPermission(permissions, 'talent_partner:access');
  const hasCandidate = hasPermission(permissions, 'candidate:access');

  if (wantsTalentPartner && !hasTalentPartner) {
    return redirectNotAuthorized(request, 'talent_partner');
  }
  if (wantsCandidate && hasTalentPartner && !hasCandidate) {
    return redirectNotAuthorized(request, 'candidate');
  }
  return null;
};
