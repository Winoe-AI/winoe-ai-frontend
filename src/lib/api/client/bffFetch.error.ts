import {
  BFF_AUTH_REQUIRED,
  BFF_FORBIDDEN,
} from './bffFetch.constants';
import { extractErrorMessage, parseResponseBody } from './response';
import { isBffTarget, toSafeBffMessage } from './bffFetch.security';
import type { ApiErrorShape } from './shapes';

type ApiErrorWithHeaders = ApiErrorShape & {
  headers?: Headers;
  code?: string;
};

function buildErrorDetails(errorBody: unknown, response: Response) {
  const retryAfterHeader = response.headers.get('retry-after');
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;
  if (!retryAfterSeconds || Number.isNaN(retryAfterSeconds)) return errorBody;

  if (errorBody && typeof errorBody === 'object') {
    return { ...(errorBody as Record<string, unknown>), retryAfterSeconds };
  }
  return { message: errorBody, retryAfterSeconds };
}

export async function throwBffFetchError(
  response: Response,
  targetUrl: string,
): Promise<never> {
  const status = response.status;
  const errorBody = await parseResponseBody(response);
  const details = buildErrorDetails(errorBody, response);
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
