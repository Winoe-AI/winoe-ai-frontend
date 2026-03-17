import { bffFetch } from './bffFetch';
import type { ApiClientOptions, InternalRequestOptions } from './shapes';

export async function requestCore<TResponse = unknown>(
  path: string,
  options: InternalRequestOptions,
  clientOptions?: ApiClientOptions,
): Promise<{ data: TResponse; status: number; headers: Headers }> {
  return bffFetch<TResponse>(path, options, clientOptions);
}
