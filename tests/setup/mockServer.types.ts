export type RouteMatcher = string | RegExp | ((path: string) => boolean);

export type MockResponseInit = {
  status?: number;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown> | Array<unknown>;
};

export type MockRequest = {
  url: URL;
  method: string;
  headers: Headers;
  bodyText: string;
  json(): Promise<unknown>;
};

export type MockResolver = (
  req: MockRequest,
) => Promise<Response | MockResponseInit> | Response | MockResponseInit;

export type Handler = {
  method: string;
  matcher: RouteMatcher;
  resolver: MockResolver;
};
