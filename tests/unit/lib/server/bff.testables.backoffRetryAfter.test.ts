import { resetBffTestState, restoreBffEnv } from './bff.testlib';

describe('bff __testables backoff and retry-after parsing', () => {
  beforeEach(() => {
    resetBffTestState();
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('jitteredBackoffMs grows exponentially and caps at max', async () => {
    const { __testables } = await import('@/lib/server/bff');
    const delay1 = __testables.jitteredBackoffMs(1, 100, 1000);
    const delay2 = __testables.jitteredBackoffMs(2, 100, 1000);
    const delay3 = __testables.jitteredBackoffMs(3, 100, 1000);
    expect(delay1).toBeGreaterThanOrEqual(100);
    expect(delay1).toBeLessThanOrEqual(200);
    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);
    expect(__testables.jitteredBackoffMs(10, 100, 500)).toBeLessThanOrEqual(500);
  });

  it('parseRetryAfterMs parses numeric seconds and nullish values', async () => {
    const { __testables } = await import('@/lib/server/bff');
    const now = Date.now();
    expect(__testables.parseRetryAfterMs('2', now, 5000)).toBe(2000);
    expect(__testables.parseRetryAfterMs('0', now, 5000)).toBeNull();
    expect(__testables.parseRetryAfterMs(null, now, 5000)).toBeNull();
  });

  it('parseRetryAfterMs handles future and past date strings', async () => {
    const { __testables } = await import('@/lib/server/bff');
    const now = Date.now();
    const futureDate = new Date(now + 1500).toUTCString();
    const pastDate = new Date(now - 1000).toUTCString();
    const result = __testables.parseRetryAfterMs(futureDate, now, 5000);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(2000);
    expect(__testables.parseRetryAfterMs(pastDate, now, 5000)).toBeNull();
  });
});
