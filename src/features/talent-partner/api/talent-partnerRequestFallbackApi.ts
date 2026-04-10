import { bffFetch, httpRequest } from '@/platform/api-client/client';
import type {
  HttpMethod,
  RequestOptions,
} from '@/platform/api-client/client/shapes';

type TalentPartnerRequestOptions = RequestOptions & {
  method?: HttpMethod;
  body?: unknown;
};

export async function runTalentPartnerFallback(
  path: string,
  options: TalentPartnerRequestOptions,
  methodUpper: HttpMethod,
) {
  if (typeof httpRequest === 'function') {
    return httpRequest<unknown>(
      path,
      { ...(options as RequestOptions), method: methodUpper },
      { basePath: '/api', skipAuth: true },
    );
  }

  const { data } = await bffFetch<unknown>(
    path,
    { ...options, method: methodUpper },
    { basePath: '/api', skipAuth: true },
  );
  return data;
}
