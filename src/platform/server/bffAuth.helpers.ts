import { NextResponse } from 'next/server';
import type { AuthResult } from './bff/authTypes';

type AuthSuccess = Extract<AuthResult, { ok: true }>;

export function allowLocalTokenFallback(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV?.toLowerCase() === 'development'
  );
}

export function buildAuthSuccessResult(params: {
  accessToken: AuthSuccess['accessToken'];
  permissions: AuthSuccess['permissions'];
  session: AuthSuccess['session'];
  cookies: AuthSuccess['cookies'];
}): AuthResult {
  return {
    ok: true,
    accessToken: params.accessToken,
    permissions: params.permissions,
    session: params.session,
    cookies: params.cookies,
  };
}

export function buildNotAuthenticatedResult(
  cookies: NextResponse,
  detail?: string,
): AuthResult {
  return {
    ok: false,
    response: NextResponse.json(
      detail
        ? { message: 'Not authenticated', detail }
        : { message: 'Not authenticated' },
      { status: 401 },
    ),
    cookies,
  };
}

export function buildForbiddenResult(cookies: NextResponse): AuthResult {
  return {
    ok: false,
    response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    cookies,
  };
}
