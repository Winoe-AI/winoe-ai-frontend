jest.mock('next/server', () => {
  const buildResponse = (status = 200, body?: unknown) => ({
    status,
    body,
    headers: { get: () => null, set: () => {} },
    cookies: { set: () => {}, getAll: () => [] },
    json: async () => body,
  });
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) =>
        buildResponse(init?.status ?? 200, body),
    },
  };
});

export const mockGetSessionNormalized = jest.fn();
export const mockExtractPermissions = jest.fn();

jest.mock('@/lib/auth0', () => ({
  getSessionNormalized: () => mockGetSessionNormalized(),
}));

jest.mock('@/lib/auth0-claims', () => ({
  extractPermissions: (...args: unknown[]) => mockExtractPermissions(...args),
}));

jest.mock('@/lib/brand', () => ({
  CUSTOM_CLAIM_ROLES: 'https://tenon.ai/roles',
}));

export const originalNodeEnv = process.env.NODE_ENV;

export function setNodeEnv(value: string) {
  Object.defineProperty(process.env, 'NODE_ENV', { value, writable: true });
}

export function resetDebugAuthRouteMocks() {
  jest.clearAllMocks();
  jest.resetModules();
}
