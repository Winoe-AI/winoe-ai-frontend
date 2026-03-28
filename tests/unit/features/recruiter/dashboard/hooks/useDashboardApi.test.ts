import { fetchDashboard, isAbortError } from '@/features/recruiter/dashboard/hooks/useDashboardApi';

const httpResultMock = jest.fn();
const mapApiErrorMock = jest.fn();
const logPerfMock = jest.fn();

jest.mock('@/platform/api-client/client', () => ({
  httpResult: (...args: unknown[]) => httpResultMock(...args),
}));

jest.mock('@/platform/api-client/errors/errorMapping', () => ({
  mapApiError: (...args: unknown[]) => mapApiErrorMock(...args),
}));

jest.mock('@/features/recruiter/dashboard/utils/perfUtils', () => ({
  dashboardPerfDebugEnabled: true,
  logPerf: (...args: unknown[]) => logPerfMock(...args),
  nowMs: () => 100,
}));

describe('useDashboardApi.fetchDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns dashboard payload with requestId on success', async () => {
    httpResultMock.mockResolvedValue({
      ok: true,
      data: {
        profile: { id: 1, name: 'Recruiter' },
        simulations: [],
        profileError: null,
        simulationsError: null,
      },
      requestId: 'req-1',
    });

    const signal = new AbortController().signal;
    const result = await fetchDashboard(signal);

    expect(result).toEqual({
      profile: { id: 1, name: 'Recruiter' },
      simulations: [],
      profileError: null,
      simulationsError: null,
      requestId: 'req-1',
    });

    expect(httpResultMock).toHaveBeenCalledWith(
      '/dashboard',
      {
        cache: 'no-store',
        signal,
        cacheTtlMs: 30_000,
        dedupeKey: 'recruiter-dashboard',
      },
      { basePath: '/api', skipAuth: true },
    );
    expect(logPerfMock).toHaveBeenCalledWith('/api/dashboard response', 100, {
      status: 200,
    });
  });

  it('maps errors, triggers redirect, and throws mapped message/status', async () => {
    const redirect = jest.fn();
    mapApiErrorMock.mockReturnValue({
      message: 'Access denied',
      status: 403,
      redirect,
    });
    httpResultMock.mockResolvedValue({
      ok: false,
      error: { status: 403, message: 'Forbidden' },
    });

    await expect(fetchDashboard()).rejects.toMatchObject({
      message: 'Access denied',
      status: 403,
    });

    expect(mapApiErrorMock).toHaveBeenCalledWith(
      { status: 403, message: 'Forbidden' },
      'Unable to load your dashboard.',
      'recruiter',
    );
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('rethrows abort errors unchanged', async () => {
    const aborted = new DOMException('Aborted', 'AbortError');
    httpResultMock.mockRejectedValue(aborted);

    await expect(fetchDashboard()).rejects.toBe(aborted);
  });

  it('logs non-abort thrown status when available', async () => {
    const err = Object.assign(new Error('boom'), { status: 500 });
    httpResultMock.mockRejectedValue(err);

    await expect(fetchDashboard()).rejects.toBe(err);

    expect(logPerfMock).toHaveBeenCalledWith('/api/dashboard response', 100, {
      status: 500,
    });
  });
});

describe('isAbortError', () => {
  it('detects DOMException and name-based abort values', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isAbortError({ name: 'TypeError' })).toBe(false);
    expect(isAbortError(new Error('x'))).toBe(false);
  });
});
