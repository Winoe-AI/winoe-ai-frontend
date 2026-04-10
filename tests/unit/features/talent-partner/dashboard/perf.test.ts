import type { Mock } from 'jest-mock';

describe('dashboard perf utilities', () => {
  const originalEnv = process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF;
  const originalPerformance = global.performance;
  const setPerformance = (value: Performance | undefined) => {
    Object.defineProperty(global, 'performance', {
      value,
      writable: true,
      configurable: true,
    });
  };

  afterEach(() => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = originalEnv;
    setPerformance(originalPerformance);
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('returns null when performance is unavailable', async () => {
    setPerformance(undefined);
    const { nowMs } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    expect(nowMs()).toBeNull();
  });

  it('does not log when perf debug is disabled', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = 'false';
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { logPerf } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    logPerf('noop');
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('logs perf payload when enabled and performance exists', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = 'true';
    setPerformance({ now: () => 2000 } as Performance);
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent') as Mock;
    const { logPerf } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    logPerf('dashboard', 1000, { status: 200 });
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual(
      expect.objectContaining({
        message: '[winoe][perf] dashboard',
        payload: expect.objectContaining({ durationMs: 1000, status: 200 }),
      }),
    );
  });

  it('returns null when performance.now is not a function', async () => {
    setPerformance({ now: 'not-a-function' } as unknown as Performance);
    const { nowMs } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    expect(nowMs()).toBeNull();
  });

  it('does not log when performance.now returns null', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = 'true';
    setPerformance(undefined);
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { logPerf } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    logPerf('test-label', 1000);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('logs without durationMs when startedAt is undefined', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = 'true';
    setPerformance({ now: () => 3000 } as Performance);
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent') as Mock;
    const { logPerf } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    logPerf('no-start');
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual(
      expect.objectContaining({
        message: '[winoe][perf] no-start',
        payload: expect.objectContaining({ atMs: 3000 }),
      }),
    );
    const payload = event.detail.payload;
    expect(payload.durationMs).toBeUndefined();
  });

  it('enables debug with "1" as env value', async () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = '1';
    setPerformance({ now: () => 1000 } as Performance);
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { logPerf } =
      await import('@/features/talent-partner/dashboard/utils/perfUtils');
    logPerf('enabled');
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
