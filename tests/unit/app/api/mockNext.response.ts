import { TextEncoder } from 'util';
import { MockHeaders } from './mockNext.headers';

export function makeResponse(
  body: string | null,
  init: { status: number; headers?: Record<string, string> },
) {
  const headers = new MockHeaders(init.headers);
  const encoder = new TextEncoder();
  const payload = body !== null ? encoder.encode(body) : null;
  const reader = (() => {
    let done = false;
    return {
      async read() {
        if (done || !payload) return { done: true, value: undefined };
        done = true;
        return { done: false, value: payload };
      },
      async cancel() {
        done = true;
      },
    };
  })();

  return {
    status: init.status,
    ok: init.status >= 200 && init.status < 300,
    headers,
    body: payload ? { getReader: () => reader } : null,
    arrayBuffer: async () => payload?.buffer ?? new ArrayBuffer(0),
  } as unknown as Response;
}
