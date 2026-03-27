import { buildRequest, matches } from './mockServer.request';
import { jsonResponse, toResponse } from './mockServer.response';
import type {
  Handler,
  MockResolver,
  RouteMatcher,
} from './mockServer.types';

export function createMockServer() {
  const handlers: Handler[] = [];
  let originalFetch: typeof fetch | null = null;

  async function handleFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const req = buildRequest(input, init);
    const handler = handlers.find(
      (h) => h.method === req.method && matches(h.matcher, req.url.pathname),
    );
    if (!handler) {
      return toResponse({
        status: 404,
        body: { message: `Unhandled request for ${req.method} ${req.url.pathname}` },
      });
    }
    return toResponse(await handler.resolver(req));
  }

  return {
    listen() {
      if (originalFetch) return;
      originalFetch = global.fetch;
      global.fetch = handleFetch as typeof fetch;
    },
    resetHandlers() {
      handlers.length = 0;
    },
    close() {
      if (originalFetch) {
        global.fetch = originalFetch;
        originalFetch = null;
      }
      handlers.length = 0;
    },
    use(method: string, matcher: RouteMatcher, resolver: MockResolver) {
      handlers.push({ method: method.toUpperCase(), matcher, resolver });
    },
  };
}

export { jsonResponse };
