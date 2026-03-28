import type { MockRequest, RouteMatcher } from './mockServer.types';

export function toURL(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input;
  if (typeof input === 'string') {
    try {
      return new URL(input);
    } catch {
      return new URL(input, 'http://localhost');
    }
  }
  try {
    return new URL((input as Request).url);
  } catch {
    return new URL('http://localhost');
  }
}

export function matches(matcher: RouteMatcher, path: string) {
  if (typeof matcher === 'string') return matcher === path;
  if (matcher instanceof RegExp) return matcher.test(path);
  return matcher(path);
}

export function buildRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): MockRequest {
  const url = toURL(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers ?? {});
  const bodyRaw = init?.body ?? '';
  const bodyText =
    typeof bodyRaw === 'string'
      ? bodyRaw
      : bodyRaw
        ? JSON.stringify(bodyRaw)
        : '';

  return {
    url,
    method,
    headers,
    bodyText,
    async json() {
      try {
        return JSON.parse(bodyText || '{}');
      } catch {
        return {};
      }
    },
  };
}
