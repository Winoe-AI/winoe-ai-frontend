import { NextRequest, NextResponse } from 'next/server';
import {
  REQUEST_ID_HEADER,
  UPSTREAM_HEADER,
  resolveRequestId,
  upstreamRequest,
} from '@/lib/server/bff';
import { DEBUG_PROXY } from './constants';
import { forwardHeaders, copyUpstreamHeaders } from './headers';
import { readBodyTextWithLimit } from './body';
import { buildProxyResponse } from './response';
import { resolveTarget, type BackendRouteContext } from './target';
import {
  enforceMutationSameOrigin,
  enforceProxyMethodPolicy,
} from './requestSecurity';

type ProxyAuthResult =
  | { ok: true; accessToken: string; cookies: NextResponse | null }
  | { ok: false; response: NextResponse; cookies: NextResponse | null };

function mergeAuthCookies(
  from: NextResponse | null | undefined,
  into: NextResponse,
) {
  if (!from) return;
  from.cookies.getAll().forEach((cookie) => {
    into.cookies.set(cookie);
  });
}

async function requireProxyAuth(req: NextRequest): Promise<ProxyAuthResult> {
  if (process.env.NODE_ENV === 'test') {
    const authHeader = req.headers.get('authorization') ?? '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return {
      ok: true,
      accessToken: match?.[1] ?? 'test-access-token',
      cookies: null,
    };
  }

  const { requireBffAuth } = await import('@/lib/server/bffAuth');
  return requireBffAuth(req);
}

export async function proxyToBackend(
  req: NextRequest,
  context: BackendRouteContext,
) {
  const start = process.env.TENON_DEBUG_PERF ? Date.now() : null;
  const requestId = resolveRequestId(req.headers);

  const { backendPath, pathSegments, targetUrl, method, timeoutMs } =
    await resolveTarget(req, context);
  const methodError = enforceProxyMethodPolicy(method, pathSegments, requestId);
  if (methodError) return methodError;

  const originError = enforceMutationSameOrigin(req, method, requestId);
  if (originError) return originError;

  const auth = await requireProxyAuth(req);
  if (!auth.ok) {
    mergeAuthCookies(auth.cookies, auth.response);
    auth.response.headers.set(REQUEST_ID_HEADER, requestId);
    return auth.response;
  }
  const headers = forwardHeaders(req);
  headers.Authorization = `Bearer ${auth.accessToken}`;

  try {
    if (DEBUG_PROXY) {
      // eslint-disable-next-line no-console
      console.log(
        `[debug:backend-proxy] [req ${requestId}] ${req.method} ${req.nextUrl.pathname}${req.nextUrl.search ?? ''} -> ${targetUrl}`,
      );
    }

    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      const limited = await readBodyTextWithLimit(req, requestId);
      if ('response' in limited) return limited.response;
      body = limited.body;
    }

    const upstream = await upstreamRequest({
      url: targetUrl,
      method,
      headers,
      body,
      cache: 'no-store',
      timeoutMs,
      requestId,
      signal: req.signal,
      maxTotalTimeMs: timeoutMs,
    });

    const upstreamHeaders = copyUpstreamHeaders(upstream, requestId);
    upstreamHeaders.set(UPSTREAM_HEADER, String(upstream.status));
    const response = await buildProxyResponse(
      upstream,
      upstreamHeaders,
      requestId,
    );
    mergeAuthCookies(auth.cookies, response);
    response.headers.delete('location');
    response.headers.set(REQUEST_ID_HEADER, requestId);

    const meta = (upstream as unknown as { _tenonMeta?: unknown })
      ._tenonMeta as { attempts?: number; durationMs?: number } | undefined;
    if (meta) {
      const retryCount = Math.max(0, (meta.attempts ?? 1) - 1);
      response.headers.set(
        'Server-Timing',
        `bff;dur=${meta.durationMs ?? 0}, retry;desc="count=${retryCount}"`,
      );
    }

    if (start !== null) {
      // eslint-disable-next-line no-console
      console.log(
        `[perf:backend-proxy] [req ${requestId}] ${req.method} ${backendPath} -> ${upstream.status} ${Date.now() - start}ms`,
      );
    }

    return response;
  } catch (e: unknown) {
    const error = NextResponse.json(
      {
        message: 'Upstream request failed',
        detail: e instanceof Error ? e.message : undefined,
      },
      {
        status: 502,
        headers: { [REQUEST_ID_HEADER]: requestId, [UPSTREAM_HEADER]: '502' },
      },
    );
    mergeAuthCookies(auth.cookies, error);
    return error;
  }
}
