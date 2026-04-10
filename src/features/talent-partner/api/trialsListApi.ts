import { safeRequest } from '@/platform/api-client/client';
import { normalizeTrial } from './trialsNormalizeApi';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import type { TrialListItem } from './typesApi';

export async function listTrials(options?: {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
}): Promise<TrialListItem[]> {
  const { data } = await requestTalentPartnerBff<unknown>('/trials', {
    cache: options?.cache,
    signal: options?.signal,
    skipCache: options?.skipCache,
    cacheTtlMs: options?.cacheTtlMs ?? 9000,
  });
  return Array.isArray(data) ? data.map(normalizeTrial) : [];
}

export async function listTrialsSafe() {
  return safeRequest<TrialListItem[]>('/trials', undefined, {
    basePath: '/api',
    skipAuth: true,
  });
}
