import { responseHelpers } from '../../../../setup';
const makeJsonResponse = (payload: unknown) =>
  responseHelpers.jsonResponse(payload) as unknown as Response;
describe('runRecruiterFallback', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset?.();
    global.fetch = realFetch;
    jest.dontMock('@/lib/api/client');
  });
  it('prefers httpRequest when available', async () => {
    const httpRequestMock = jest.fn().mockResolvedValue({ ok: true });
    const bffFetchMock = jest.fn();
    jest.doMock('@/lib/api/client', () => {
      const actual = jest.requireActual('@/lib/api/client');
      return {
        ...actual,
        httpRequest: httpRequestMock,
        bffFetch: bffFetchMock,
      };
    });
    const { runRecruiterFallback } =
      await import('@/features/recruiter/api/recruiterRequestFallback');
    const result = await runRecruiterFallback(
      '/backend/simulations',
      { headers: { 'x-test': '1' } },
      'POST',
    );
    expect(result).toEqual({ ok: true });
    expect(httpRequestMock).toHaveBeenCalledWith(
      '/backend/simulations',
      { headers: { 'x-test': '1' }, method: 'POST' },
      { basePath: '/api', skipAuth: true },
    );
    expect(bffFetchMock).not.toHaveBeenCalled();
  });
  it('normalizes /backend paths via bffFetch fallback with basePath /api', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse({ ok: true }),
    );
    jest.doMock('@/lib/api/client', () => {
      const actual = jest.requireActual('@/lib/api/client');
      return {
        ...actual,
        httpRequest: undefined,
        bffFetch: actual.bffFetch,
      };
    });
    const { runRecruiterFallback } =
      await import('@/features/recruiter/api/recruiterRequestFallback');
    const result = await runRecruiterFallback(
      '/backend/simulations',
      {},
      'GET',
    );
    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/backend/simulations',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
      }),
    );
  });
  it('does not double-prefix /api paths in bffFetch fallback', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse({ ok: true }),
    );
    jest.doMock('@/lib/api/client', () => {
      const actual = jest.requireActual('@/lib/api/client');
      return {
        ...actual,
        httpRequest: undefined,
        bffFetch: actual.bffFetch,
      };
    });
    const { runRecruiterFallback } =
      await import('@/features/recruiter/api/recruiterRequestFallback');
    await runRecruiterFallback('/api/backend/simulations', {}, 'GET');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/backend/simulations',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
      }),
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).not.toBe(
      '/api/api/backend/simulations',
    );
  });
});
