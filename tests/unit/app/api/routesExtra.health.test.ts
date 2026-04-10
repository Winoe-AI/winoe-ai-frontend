import { markMetadataCovered } from './coverageHelpers';
import './routesExtra.testlib';

describe('API routes extra coverage - health route', () => {
  const originalEnv = { ...process.env };
  const realFetch = global.fetch;

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = realFetch;
  });

  it('logs perf timing when debug enabled', async () => {
    process.env.WINOE_DEBUG_PERF = '1';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(
      new (class {
        status = 200;
        headers = new Map([['content-type', 'application/json']]);
        async json() {
          return { ok: true };
        }
      })() as unknown as Response,
    ) as unknown as typeof fetch;

    const mod = await import('@/app/api/health/route');
    markMetadataCovered('@/app/api/health/route');
    const result = await mod.GET();
    expect(result.status).toBe(200);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
