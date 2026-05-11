import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateSessionCookie } from '@auth0/nextjs-auth0/testing';
import { isLocalEnvironment } from '@/app/api/accessTokenRouteEnvironment';
import {
  CUSTOM_CLAIM_EMAIL,
  CUSTOM_CLAIM_PERMISSIONS,
  CUSTOM_CLAIM_ROLES,
} from '@/platform/config/brand';
import { sanitizeReturnTo } from '@/platform/auth/routing';

type QaRole = 'talent_partner' | 'candidate';

const ROLE_PERMISSIONS: Record<QaRole, string[]> = {
  talent_partner: ['talent_partner:access'],
  candidate: ['candidate:access'],
};

const ROLE_DEFAULT_RETURN_TO: Record<QaRole, string> = {
  talent_partner: '/dashboard/trials',
  candidate: '/candidate/dashboard',
};

const ONE_HOUR_SECONDS = 60 * 60;

function resolveQaRole(raw: string | null): QaRole {
  return raw === 'candidate' ? 'candidate' : 'talent_partner';
}

function resolveEmail(role: QaRole, rawEmail: string | null): string {
  if (rawEmail && rawEmail.trim()) {
    return rawEmail.trim().toLowerCase();
  }
  return role === 'candidate'
    ? process.env.QA_E2E_CANDIDATE_EMAIL?.trim().toLowerCase() ||
        'candidate1@local.test'
    : process.env.QA_E2E_TALENT_PARTNER_EMAIL?.trim().toLowerCase() ||
        'talent_partner1@local.test';
}

function buildSession(role: QaRole, email: string) {
  const permissions = ROLE_PERMISSIONS[role];
  const now = Math.floor(Date.now() / 1000);

  return {
    user: {
      sub: `${role}:${email}`,
      email,
      name: role === 'candidate' ? 'QA Candidate' : 'QA Talent Partner',
      email_verified: true,
      permissions,
      roles: [role],
      [CUSTOM_CLAIM_PERMISSIONS]: permissions,
      [CUSTOM_CLAIM_ROLES]: [role],
      [CUSTOM_CLAIM_EMAIL]: email,
    },
    tokenSet: {
      accessToken: `${role}:${email}`,
      expiresAt: now + ONE_HOUR_SECONDS,
      token_type: 'Bearer',
      scope: 'openid profile email',
      audience: process.env.WINOE_AUTH0_AUDIENCE ?? 'https://api.winoe.ai',
    },
    accessToken: `${role}:${email}`,
    internal: {
      sid: `qa-dev-${role}`,
      createdAt: now,
    },
  };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  if (!isLocalEnvironment() || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const secret = process.env.WINOE_AUTH0_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        message:
          'WINOE_AUTH0_SECRET is required to mint local QA sessions for /api/dev/qa-login.',
      },
      { status: 503 },
    );
  }

  const role = resolveQaRole(req.nextUrl.searchParams.get('role'));
  const email = resolveEmail(role, req.nextUrl.searchParams.get('email'));
  const returnTo = sanitizeReturnTo(
    req.nextUrl.searchParams.get('returnTo') ??
      ROLE_DEFAULT_RETURN_TO[role] ??
      '/dashboard',
  );
  const session = buildSession(role, email);
  const encryptedSession = await generateSessionCookie(session, { secret });
  const redirectUrl = new URL(returnTo, req.nextUrl.origin);
  const secure = redirectUrl.protocol === 'https:';
  const expires = new Date(Date.now() + ONE_HOUR_SECONDS * 1000);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('__session', encryptedSession, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires,
  });
  response.cookies.set('appSession', encryptedSession, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires,
  });

  return response;
}
