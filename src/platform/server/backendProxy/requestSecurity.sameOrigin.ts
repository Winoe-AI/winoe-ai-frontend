import { NextRequest, NextResponse } from 'next/server';
import { REQUEST_ID_HEADER, UPSTREAM_HEADER } from '@/platform/server/bff';
import { STATE_CHANGING_METHODS } from './requestSecurity.constants';
import type { ProxyMethod } from './requestSecurity.types';

function normalizeOrigin(value: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.origin.toLowerCase();
  } catch {
    return null;
  }
}

export function enforceMutationSameOrigin(
  req: NextRequest,
  method: string,
  requestId: string,
) {
  const normalizedMethod = method.toUpperCase() as ProxyMethod;
  if (!STATE_CHANGING_METHODS.has(normalizedMethod)) return null;

  const hasCookieAuth = Boolean((req.headers.get('cookie') ?? '').trim());
  if (!hasCookieAuth) return null;

  const expectedOrigin = normalizeOrigin(req.nextUrl.origin);
  const origin = normalizeOrigin(req.headers.get('origin'));
  const refererOrigin = normalizeOrigin(req.headers.get('referer'));
  const observedOrigin = origin ?? refererOrigin;
  if (expectedOrigin && observedOrigin === expectedOrigin) return null;

  return NextResponse.json(
    { message: 'Forbidden' },
    {
      status: 403,
      headers: {
        [REQUEST_ID_HEADER]: requestId,
        [UPSTREAM_HEADER]: '403',
      },
    },
  );
}
