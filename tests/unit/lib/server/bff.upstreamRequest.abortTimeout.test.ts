import { resetBffTestState, restoreBffEnv } from './bff.testlib';

describe('bff upstreamRequest abort/timeout/budget behavior', () => {
  beforeEach(() => {
    resetBffTestState();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('throws when a request times out', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((_, init: RequestInit) => {
      const signal = init.signal as AbortSignal | undefined;
      return new Promise<Response>((_, reject) =>
        signal?.addEventListener('abort', () =>
          reject(signal.reason ?? new DOMException('Aborted', 'AbortError')),
        ),
      );
    }) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/platform/server/bff');
    const promise = upstreamRequest({
      url: 'https://api.test/slow',
      requestId: 'req-2',
      timeoutMs: 5,
      maxAttempts: 1,
      method: 'GET',
      headers: {},
    });
    jest.runOnlyPendingTimers();
    await expect(promise).rejects.toThrow(/timed out/i);
  });

  it('aborts immediately when caller signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('caller-cancel'));
    global.fetch = jest.fn();
    const { upstreamRequest } = await import('@/platform/server/bff');
    await expect(
      upstreamRequest({
        url: 'https://api.test/abort',
        requestId: 'req-4',
        timeoutMs: 100,
        maxAttempts: 1,
        method: 'GET',
        headers: {},
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ message: 'caller-cancel' });
  });

  it('throws when maxTotalTimeMs budget is exceeded', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const bad = new Response('bad', { status: 502 });
    Object.defineProperty(bad, 'body', {
      configurable: true,
      value: {
        cancel: jest.fn().mockResolvedValue(undefined),
      },
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue(bad as unknown as Response) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/platform/server/bff');
    const promise = upstreamRequest({
      url: 'https://api.test/budget',
      requestId: 'req-budget',
      timeoutMs: 1000,
      maxTotalTimeMs: 1,
      maxAttempts: 3,
      method: 'GET',
      headers: {},
    });
    await expect(promise).rejects.toThrow(/max total time/i);
  });

  it('rethrows caller abort during retry wait', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const controller = new AbortController();
    const bad = new Response('bad', { status: 503 });
    Object.defineProperty(bad, 'body', {
      configurable: true,
      value: {
        cancel: jest.fn().mockResolvedValue(undefined),
      },
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue(bad as unknown as Response) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/platform/server/bff');
    const promise = upstreamRequest({
      url: 'https://api.test/abort-wait',
      requestId: 'req-abort-wait',
      timeoutMs: 500,
      maxTotalTimeMs: 5000,
      maxAttempts: 3,
      method: 'GET',
      headers: {},
      signal: controller.signal,
    });
    await Promise.resolve();
    await Promise.resolve();
    controller.abort(new Error('user-cancelled'));
    jest.runOnlyPendingTimers();
    await expect(promise).rejects.toThrow(/user-cancelled/i);
  });
});
