import { NextResponse } from 'next/server';
import { REQUEST_ID_HEADER, UPSTREAM_HEADER } from '@/lib/server/bff';
import type { ProxyMethod } from './requestSecurity.types';

export function methodNotAllowed(
  allowed: readonly ProxyMethod[],
  requestId: string,
) {
  return NextResponse.json(
    { message: 'Method Not Allowed' },
    {
      status: 405,
      headers: {
        Allow: allowed.join(', '),
        [REQUEST_ID_HEADER]: requestId,
        [UPSTREAM_HEADER]: '405',
      },
    },
  );
}
