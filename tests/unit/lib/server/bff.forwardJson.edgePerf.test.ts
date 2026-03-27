import { resetBffTestState, restoreBffEnv } from './bff.testlib';

describe('bff forwardJson edge/perf behavior', () => {
  const originalDebugPerf = process.env.TENON_DEBUG_PERF;

  beforeEach(() => {
    resetBffTestState();
  });

  afterEach(() => {
    jest.resetModules();
    if (originalDebugPerf === undefined) delete process.env.TENON_DEBUG_PERF;
    else process.env.TENON_DEBUG_PERF = originalDebugPerf;
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('logs perf output when DEBUG_PERF is enabled', async () => {
    process.env.TENON_DEBUG_PERF = 'true';
    jest.resetModules();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    const { forwardJson } = await import('@/lib/server/bff');
    await forwardJson({ path: '/api/perf-test', method: 'GET', accessToken: 'tok' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[perf:bff]'));
    logSpy.mockRestore();
  });

  it('passes string body without re-serializing and respects caller Content-Type', async () => {
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    const { forwardJson } = await import('@/lib/server/bff');
    await forwardJson({ path: '/api/string-body', method: 'POST', body: '{"already":"serialized"}', accessToken: 'tok' });
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe('{"already":"serialized"}');
    await forwardJson({ path: '/api/custom-ct', method: 'POST', body: { data: 'test' }, headers: { 'Content-Type': 'text/plain' }, accessToken: 'tok' });
    const headers = (global.fetch as jest.Mock).mock.calls[1][1].headers as Headers;
    expect(headers.get('content-type')).toBe('text/plain');
  });

  it('logs error perf output when request fails', async () => {
    process.env.TENON_DEBUG_PERF = 'true';
    jest.resetModules();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;
    const { forwardJson } = await import('@/lib/server/bff');
    await expect(forwardJson({ path: '/api/error-test', method: 'POST', accessToken: 'tok', timeoutMs: 100 })).rejects.toThrow('network error');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('error'));
    logSpy.mockRestore();
  });
});
