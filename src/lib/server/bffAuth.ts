import { NextRequest, NextResponse } from 'next/server';
import { auth0, getSessionNormalized } from '@/lib/auth0';
import { extractPermissions, hasPermission } from '@/lib/auth0-claims';
import { normalizeAccessToken } from '@/lib/auth0/helpers';
import type { AuthResult } from './bff/authTypes';
import {
  allowLocalTokenFallback,
  buildAuthSuccessResult,
  buildForbiddenResult,
  buildNotAuthenticatedResult,
} from './bffAuth.helpers';

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
  const start = process.env.TENON_DEBUG_PERF ? Date.now() : null;
  const logPerf = (status: string) => {
    if (start === null) return;
    // eslint-disable-next-line no-console
    console.log(
      `[perf:bff-auth] permission=${options?.requirePermission ?? 'any'} status=${status} ${Date.now() - start}ms`,
    );
  };

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
