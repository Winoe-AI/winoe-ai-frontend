import { NextResponse } from 'next/server';
import { REQUEST_ID_HEADER, UPSTREAM_HEADER } from '@/platform/server/bff';
import { buildProxyResponse } from './response';
import { copyUpstreamHeaders } from './headers';
import { mergeAuthCookies } from './proxyAuth';

type Params = {
  upstream: Response;
  requestId: string;
  backendPath: string;
  method: string;
  start: number | null;
  authCookies: NextResponse | null;
};

export async function buildBackendProxySuccessResponse({
  upstream,
  requestId,
  backendPath,
  method,
  start,
  authCookies,
}: Params): Promise<NextResponse> {
  const upstreamHeaders = copyUpstreamHeaders(upstream, requestId);
  upstreamHeaders.set(UPSTREAM_HEADER, String(upstream.status));
  const response = await buildProxyResponse(
    upstream,
    upstreamHeaders,
    requestId,
  );
  mergeAuthCookies(authCookies, response);
  response.headers.delete('location');
  response.headers.set(REQUEST_ID_HEADER, requestId);

  const meta = (upstream as unknown as { _winoeMeta?: unknown })._winoeMeta as
    | { attempts?: number; durationMs?: number }
    | undefined;
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
      `[perf:backend-proxy] [req ${requestId}] ${method} ${backendPath} -> ${upstream.status} ${Date.now() - start}ms`,
    );
  }

  return response;
}
