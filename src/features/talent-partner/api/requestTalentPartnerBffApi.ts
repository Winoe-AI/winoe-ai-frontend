import { talentPartnerBffClient } from '@/platform/api-client/client';
import type {
  HttpMethod,
  RequestOptions,
} from '@/platform/api-client/client/shapes';
import { HttpError } from '@/platform/api-client/errors/errors';
import { runTalentPartnerFallback } from './talent-partnerRequestFallbackApi';
import { parseTalentPartnerResponse } from './talent-partnerResponseApi';

type TalentPartnerRequestOptions = RequestOptions & {
  method?: HttpMethod;
  body?: unknown;
};

export async function requestTalentPartnerBff<T>(
  path: string,
  options: TalentPartnerRequestOptions = {},
) {
  const methodUpper = (options.method ?? 'GET') as HttpMethod;
  const method = methodUpper.toLowerCase() as Lowercase<HttpMethod>;
  const client = talentPartnerBffClient as unknown as Record<string, unknown>;
  const exec = async (target: string, opts: TalentPartnerRequestOptions) => {
    if (typeof client[method] === 'function') {
      const { body, method: _ignored, ...rest } = opts ?? {};
      const call = client[method] as (...args: unknown[]) => Promise<unknown>;
      if (methodUpper === 'GET' || methodUpper === 'DELETE') {
        return call(target, rest);
      }
      return call(target, body, rest);
    }
    return runTalentPartnerFallback(target, opts, methodUpper);
  };

  try {
    const res = await exec(path, options);
    return parseTalentPartnerResponse<T>(res);
  } catch (err) {
    throw toTalentPartnerHttpError(err);
  }
}

export { talentPartnerBffClient };

function toTalentPartnerHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  const message =
    err instanceof Error && err.message ? err.message : 'Request failed';
  const httpErr = new HttpError(
    (err as { status?: number })?.status ?? 500,
    message,
    (err as { headers?: Headers }).headers,
  );
  if (err && typeof err === 'object') {
    (httpErr as { details?: unknown }).details = (
      err as { details?: unknown }
    ).details;
  }
  return httpErr;
}
