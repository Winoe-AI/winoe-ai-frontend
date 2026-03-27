import { isSameOriginRequest } from './origin';
import { parseResponseBody } from './response';
import { isAbsoluteHttpUrl, joinBaseAndPath } from './url';
import type { ApiClientOptions, InternalRequestOptions } from './shapes';
import { DEFAULT_BASE_PATH } from './bffFetch.constants';
import { throwBffFetchError } from './bffFetch.error';
import { assertSafeBffRequest, isBffTarget } from './bffFetch.security';

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

  if (!response.ok) {
    await throwBffFetchError(response, targetUrl);
  }

  const parsed =
    response.status === 204
      ? (undefined as TResponse)
      : ((await parseResponseBody(response)) as TResponse);

  return { data: parsed, status: response.status, headers: response.headers };
}
