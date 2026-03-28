import { BFF_UNSAFE_REQUEST } from './bffFetch.constants';
import { isAbsoluteHttpUrl } from './url';
import type { InternalRequestOptions, ApiErrorShape } from './shapes';

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

export function isBffTarget(targetUrl: string) {
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

export function assertSafeBffRequest(
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

export function toSafeBffMessage(status: number, fallback: string) {
  if (status === 401) return 'Authentication required. Please sign in again.';
  if (status === 403) {
    return 'Request blocked by security policy. Please refresh and try again.';
  }
  return fallback;
}
