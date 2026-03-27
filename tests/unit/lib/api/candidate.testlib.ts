export const mockPost = jest.fn();
export const mockGet = jest.fn();
export const mockRequestWithMeta = jest.fn();

jest.mock('@/platform/api-client/client', () => {
  const actual = jest.requireActual('@/platform/api-client/client');
  return { ...actual, apiClient: { post: mockPost, get: mockGet } };
});

jest.mock('@/platform/api-client/client/request', () => ({
  requestWithMeta: (...args: unknown[]) => mockRequestWithMeta(...args),
}));

export async function importCandidateApi() {
  return import('@/features/candidate/session/api');
}

export function resetCandidateApiMocks() {
  jest.resetModules();
  mockPost.mockReset();
  mockGet.mockReset();
  mockRequestWithMeta.mockImplementation(
    async (
      path: string,
      options?: Record<string, unknown>,
      client?: unknown,
    ) => {
      const method = ((options?.method as string) ?? 'GET').toUpperCase();
      if (method === 'GET') {
        const data = await mockGet(path, options, client);
        return {
          data,
          headers: (options as { headers?: Headers })?.headers ?? null,
        };
      }
      const data = await mockPost(path, options?.body ?? {}, options, client);
      return {
        data,
        headers: (options as { headers?: Headers })?.headers ?? null,
      };
    },
  );
  mockRequestWithMeta.mockClear();
}
