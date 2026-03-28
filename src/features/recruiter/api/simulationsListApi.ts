import { safeRequest } from '@/platform/api-client/client';
import { normalizeSimulation } from './simulationsNormalizeApi';
import { requestRecruiterBff } from './requestRecruiterBffApi';
import type { SimulationListItem } from './typesApi';

export async function listSimulations(options?: {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
}): Promise<SimulationListItem[]> {
  const { data } = await requestRecruiterBff<unknown>('/simulations', {
    cache: options?.cache,
    signal: options?.signal,
    skipCache: options?.skipCache,
    cacheTtlMs: options?.cacheTtlMs ?? 9000,
  });
  return Array.isArray(data) ? data.map(normalizeSimulation) : [];
}

export async function listSimulationsSafe() {
  return safeRequest<SimulationListItem[]>('/simulations', undefined, {
    basePath: '/api',
    skipAuth: true,
  });
}
