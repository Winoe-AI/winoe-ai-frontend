import { isSameOriginRequest } from './origin';
import { extractErrorMessage, parseResponseBody } from './response';
import { isAbsoluteHttpUrl, joinBaseAndPath } from './url';
import type {
  ApiClientOptions,
  ApiErrorShape,
  InternalRequestOptions,
} from './shapes';

const DEFAULT_BASE_PATH =
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL ?? '/api/backend';

const BFF_AUTH_REQUIRED = 'BFF_AUTH_REQUIRED';
const BFF_FORBIDDEN = 'BFF_FORBIDDEN';
const BFF_UNSAFE_REQUEST = 'BFF_UNSAFE_REQUEST';

type ApiErrorWithHeaders = ApiErrorShape & {
  headers?: Headers;
  code?: string;
};

function toPathname(targetUrl: string) {
  if (targetUrl.startsWith('/')) {
    const queryIndex = targetUrl.indexOf('?');
    return queryIndex >= 0 ? targetUrl.slice(0, queryIndex) : targetUrl;
  }
  if (isAbsoluteHttpUrl(targetUrl)) {
    try {
      return new URL(targetUrl).pathname;
    } catch {
      return '';
    }
  }
  return '';
}

function isBffTarget(targetUrl: string) {
  return toPathname(targetUrl).startsWith('/api');
}

function throwUnsafeBffRequest(message: string): never {
  const error: ApiErrorWithHeaders = {
    message,
    status: 400,
    code: BFF_UNSAFE_REQUEST,
  };
  throw error;
}

function assertSafeBffRequest(
  targetUrl: string,
  options: InternalRequestOptions,
  sameOrigin: boolean,
) {
  if (!isBffTarget(targetUrl)) return;
  if (options.mode === 'no-cors') {
    throwUnsafeBffRequest('BFF requests cannot use mode "no-cors".');
  }
  if (isAbsoluteHttpUrl(targetUrl)) {
    throwUnsafeBffRequest(
      'BFF requests must use relative same-origin URLs (for example, /api/backend/...).',
    );
  }
  if (!targetUrl.startsWith('/')) {
    throwUnsafeBffRequest('BFF requests must use absolute-path URLs.');
  }
  if (!sameOrigin) {
    throwUnsafeBffRequest('BFF requests must be same-origin.');
  }
}

function toSafeBffMessage(status: number, fallback: string) {
  if (status === 401) return 'Authentication required. Please sign in again.';
  if (status === 403)
    return 'Request blocked by security policy. Please refresh and try again.';
  return fallback;
}

export async function bffFetch<TResponse = unknown>(
  path: string,
  options: InternalRequestOptions,
  clientOptions?: ApiClientOptions,
): Promise<{ data: TResponse; status: number; headers: Headers }> {
  const basePath = clientOptions?.basePath ?? DEFAULT_BASE_PATH;
  const targetUrl = isAbsoluteHttpUrl(path)
    ? path
    : joinBaseAndPath(basePath, path);
  const sameOrigin = isSameOriginRequest(targetUrl);
  assertSafeBffRequest(targetUrl, options, sameOrigin);

  const fetchFn: typeof fetch = (
    globalThis as unknown as { fetch: typeof fetch }
  ).fetch;
  const browserRuntime = typeof window !== 'undefined';
  const credentials =
    options.credentials ??
    (sameOrigin || isBffTarget(targetUrl) ? 'same-origin' : 'omit');
  const cache = options.cache ?? (sameOrigin ? 'no-store' : undefined);
  const mode =
    options.mode ??
    (browserRuntime && isBffTarget(targetUrl) ? 'same-origin' : undefined);

  const response = (await fetchFn(targetUrl, {
    method: options.method,
    headers: options.headers,
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
    credentials,
    cache,
    mode,
    signal: options.signal,
  })) as Response;

  const status = response.status;
  if (!response.ok) {
    const errorBody = await parseResponseBody(response);
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader
      ? Number(retryAfterHeader)
      : null;
    const details =
      retryAfterSeconds && !Number.isNaN(retryAfterSeconds)
        ? errorBody && typeof errorBody === 'object'
          ? { ...(errorBody as Record<string, unknown>), retryAfterSeconds }
          : { message: errorBody, retryAfterSeconds }
        : errorBody;

    const fallbackMessage = extractErrorMessage(errorBody, status);
    const message = isBffTarget(targetUrl)
      ? toSafeBffMessage(status, fallbackMessage)
      : fallbackMessage;
    const code =
      status === 401
        ? BFF_AUTH_REQUIRED
        : status === 403
          ? BFF_FORBIDDEN
          : undefined;

    const error: ApiErrorWithHeaders = {
      message,
      status,
      details,
      headers: response.headers,
      code,
    };
    throw error;
  }

  const parsed =
    response.status === 204
      ? (undefined as TResponse)
      : ((await parseResponseBody(response)) as TResponse);

  return { data: parsed, status, headers: response.headers };
}
