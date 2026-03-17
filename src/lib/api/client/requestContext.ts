import { buildCacheKey, DEFAULT_CACHE_TTL_MS } from './cache';
import { isAbsoluteHttpUrl, joinBaseAndPath } from './url';
import type {
  ApiClientOptions,
  HttpMethod,
  InternalRequestOptions,
} from './shapes';

export type RequestContext = {
  headers: Record<string, string>;
  cacheKey: string | null;
  dedupeKey: string | null;
  skipCache: boolean;
  dedupeEnabled: boolean;
  cacheTtlMs: number;
  targetUrl: string;
  method: HttpMethod;
};

export function buildRequestContext(
  path: string,
  options: InternalRequestOptions,
  clientOptions?: ApiClientOptions,
): RequestContext {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  const isForm = options.body instanceof FormData;
  const hasBody = options.body !== undefined;
  if (hasBody && !isForm && !headers['Content-Type'])
    headers['Content-Type'] = 'application/json';
  if ((!hasBody || isForm) && headers['Content-Type'] === undefined)
    delete headers['Content-Type'];

  const skipCache = options.skipCache === true;
  const dedupeEnabled = options.disableDedupe !== true;
  const cacheTtlMs = Math.min(
    Math.max(options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, 0),
    15000,
  );
  const basePath = clientOptions?.basePath;
  const targetUrl = isAbsoluteHttpUrl(path)
    ? path
    : joinBaseAndPath(basePath ?? '', path);

  const method = (options.method ?? 'GET') as HttpMethod;
  const dedupeKey =
    method && dedupeEnabled
      ? buildCacheKey(method, targetUrl, false, options.dedupeKey)
      : null;
  const cacheKey = !skipCache && cacheTtlMs > 0 ? dedupeKey : null;

  return {
    headers,
    cacheKey,
    dedupeKey,
    skipCache,
    dedupeEnabled,
    cacheTtlMs,
    targetUrl,
    method,
  };
}
