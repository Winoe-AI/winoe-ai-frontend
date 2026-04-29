import { NextRequest, NextResponse } from 'next/server';
import { envFlagEnabled } from '@/platform/config/envFlags';
import { auth0, getSessionNormalized } from '@/platform/auth0';
import { extractPermissions, hasPermission } from '@/platform/auth0/claims';
import { normalizeAccessToken } from '@/platform/auth0/helpers';
import type { AuthResult } from './bff/authTypes';
import {
  allowLocalTokenFallback,
  buildAuthSuccessResult,
  buildForbiddenResult,
  buildNotAuthenticatedResult,
} from './bffAuth.helpers';

function resolveLocalDevAuthFallback(req: NextRequest) {
  if (!allowLocalTokenFallback()) return null;

  const authorization = req.headers?.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const accessToken = normalizeAccessToken(match?.[1]);
  if (!accessToken) return null;

  const devUserEmail = req.headers?.get('x-dev-user-email')?.trim() ?? '';
  const tokenUserEmail = accessToken.includes(':')
    ? accessToken.slice(accessToken.indexOf(':') + 1)
    : '';
  const email = devUserEmail || tokenUserEmail || undefined;
  const roles = accessToken.startsWith('talent_partner:')
    ? ['talent_partner']
    : ['candidate'];
  const permissions = roles.includes('talent_partner')
    ? ['talent_partner:access']
    : ['candidate:access'];

  return {
    accessToken,
    permissions,
    session: {
      user: {
        sub: email ?? 'local-dev',
        name: email ?? 'Local Dev User',
        email,
        email_verified: true,
        roles,
        permissions,
      },
      tokenSet: {
        accessToken,
        token_type: 'Bearer',
        scope: '',
        audience: '',
        expiresAt: 0,
      },
      internal: {
        sid: 'local-dev',
        createdAt: 0,
      },
      accessToken,
    },
  };
}

export function mergeResponseCookies(
  from: NextResponse | null | undefined,
  into: NextResponse,
) {
  if (!from) return;
  from.cookies.getAll().forEach((cookie) => {
    into.cookies.set(cookie);
  });
}

export async function requireBffAuth(
  req: NextRequest,
  options?: { requirePermission?: string },
): Promise<AuthResult> {
  const cookieCarrier = NextResponse.next();
  const start = envFlagEnabled(process.env.WINOE_DEBUG_PERF)
    ? Date.now()
    : null;
  const logPerf = (status: string) => {
    if (start === null) return;
    // eslint-disable-next-line no-console
    console.log(
      `[perf:bff-auth] permission=${options?.requirePermission ?? 'any'} status=${status} ${Date.now() - start}ms`,
    );
  };

  const localDevFallback = resolveLocalDevAuthFallback(req);
  if (localDevFallback) {
    logPerf('local-dev-fallback');
    return buildAuthSuccessResult({
      accessToken: localDevFallback.accessToken,
      permissions: localDevFallback.permissions,
      session: localDevFallback.session,
      cookies: cookieCarrier,
    });
  }

  const session = await getSessionNormalized();
  if (!session) {
    logPerf('unauthenticated');
    return buildNotAuthenticatedResult(cookieCarrier);
  }

  const permissions = extractPermissions(
    session.user,
    normalizeAccessToken(session as unknown),
  );
  const sessionAccessToken = normalizeAccessToken(session as unknown);
  if (
    options?.requirePermission &&
    !hasPermission(permissions, options.requirePermission)
  ) {
    logPerf('forbidden');
    return buildForbiddenResult(cookieCarrier);
  }

  try {
    const tokenResult = await auth0.getAccessToken(req, cookieCarrier, {
      refresh: true,
    });
    const accessToken = normalizeAccessToken(tokenResult);
    if (!accessToken) {
      if (allowLocalTokenFallback() && sessionAccessToken) {
        const result = buildAuthSuccessResult({
          accessToken: sessionAccessToken,
          permissions,
          session,
          cookies: cookieCarrier,
        });
        logPerf('fallback-token');
        return result;
      }
      logPerf('missing-token');
      return buildNotAuthenticatedResult(cookieCarrier);
    }

    const result = buildAuthSuccessResult({
      accessToken,
      permissions,
      session,
      cookies: cookieCarrier,
    });
    logPerf('ok');
    return result;
  } catch (e: unknown) {
    if (allowLocalTokenFallback() && sessionAccessToken) {
      const result = buildAuthSuccessResult({
        accessToken: sessionAccessToken,
        permissions,
        session,
        cookies: cookieCarrier,
      });
      logPerf('fallback-token');
      return result;
    }
    const message =
      e instanceof Error ? e.message : 'Unable to obtain access token';
    logPerf('token-error');
    return buildNotAuthenticatedResult(cookieCarrier, message);
  }
}
