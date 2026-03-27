import type { MockResponseInit } from './mockServer.types';

export function toResponse(init: Response | MockResponseInit): Response {
  if (typeof Response !== 'undefined' && init instanceof Response) return init;

  const status = init.status ?? 200;
  const headerMap = init.headers ?? {};
  const lower = Object.fromEntries(
    Object.entries(headerMap).map(([k, v]) => [k.toLowerCase(), v]),
  );

  const bodyIsString = typeof init.body === 'string';
  const bodyText =
    init.body === undefined
      ? ''
      : bodyIsString
        ? (init.body as string)
        : JSON.stringify(init.body);

  if (typeof Response !== 'undefined') {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has('content-type')) {
      headers.set(
        'content-type',
        bodyIsString ? 'text/plain' : 'application/json',
      );
    }
    return new Response(bodyText, { status, headers });
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
    json: async () => {
      try {
        return JSON.parse(bodyText || '{}');
      } catch {
        return {};
      }
    },
    text: async () => bodyText,
  } as unknown as Response;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
) {
  return toResponse({ body: body as Record<string, unknown>, status, headers });
}
