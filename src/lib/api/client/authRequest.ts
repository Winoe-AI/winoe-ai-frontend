import { request } from './request';
import { isSameOriginRequest } from './origin';
import type {
  ApiClientOptions,
  ApiErrorShape,
  HttpMethod,
  RequestOptions,
} from './shapes';

const isApiClientOptions = (arg: unknown): arg is ApiClientOptions =>
  Boolean(
    arg &&
    typeof arg === 'object' &&
    ('basePath' in (arg as object) || 'skipAuth' in (arg as object)),
  );

export function authedRequest<T>(
  path: string,
  options: { method: HttpMethod; body?: unknown } & RequestOptions,
  clientOptions?: ApiClientOptions,
) {
  return request<T>(path, { ...options }, clientOptions);
}

export function splitArgs(
  path: string,
  arg2?: ApiClientOptions | RequestOptions,
  arg3?: ApiClientOptions,
) {
  const requestOptions: RequestOptions | undefined = isApiClientOptions(arg2)
    ? undefined
    : (arg2 as RequestOptions | undefined);
  const clientOptions: ApiClientOptions | undefined = isApiClientOptions(arg2)
    ? (arg2 as ApiClientOptions)
    : arg3;
  return { requestOptions, clientOptions };
}

export async function safeRequest<T>(
  path: string,
  options?: { method?: HttpMethod; body?: unknown } & RequestOptions,
  clientOptions?: ApiClientOptions,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await authedRequest<T>(
      path,
      { ...(options ?? {}), method: options?.method ?? 'GET' },
      clientOptions,
    );
    return { data, error: null };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error(typeof err === 'string' ? err : 'Request failed');
    return { data: null, error };
  }
}

export type { ApiClientOptions, ApiErrorShape, HttpMethod, RequestOptions };

export { isSameOriginRequest };
