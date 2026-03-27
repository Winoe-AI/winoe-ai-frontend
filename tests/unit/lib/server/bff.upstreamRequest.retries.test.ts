import { resetBffTestState, restoreBffEnv } from './bff.testlib';

describe('bff upstreamRequest retry behavior', () => {
  beforeEach(() => {
    resetBffTestState();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('retries on retryable status and annotates attempts meta', async () => {
    const bad = new Response('bad', { status: 502 });
    (bad as unknown as { body?: { cancel?: () => Promise<void> } }).body = { cancel: jest.fn().mockResolvedValue(undefined) };
    const good = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    global.fetch = jest.fn().mockResolvedValueOnce(bad as unknown as Response).mockResolvedValueOnce(good as unknown as Response) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/lib/server/bff');
    const resp = await upstreamRequest({ url: 'https://api.test/data', requestId: 'req-1', timeoutMs: 200, maxTotalTimeMs: 1000, maxAttempts: 2, method: 'GET', headers: {} });
    expect(resp.status).toBe(200);
    expect((resp as unknown as { _tenonMeta?: { attempts?: number } })._tenonMeta?.attempts).toBe(2);
  });

  it('honors retry-after on 429 responses', async () => {
    const first = new Response('rate', { status: 429, headers: { 'retry-after': '1' } });
    const second = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    global.fetch = jest.fn().mockResolvedValueOnce(first as unknown as Response).mockResolvedValueOnce(second as unknown as Response) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/lib/server/bff');
    const resp = await upstreamRequest({ url: 'https://api.test/rate', requestId: 'req-3', timeoutMs: 500, maxTotalTimeMs: 2000, maxAttempts: 2, method: 'GET', headers: {} });
    expect(resp.status).toBe(200);
    expect((resp as unknown as { _tenonMeta?: { attempts?: number } })._tenonMeta?.attempts).toBe(2);
  });

  it('falls back to arrayBuffer cleanup when body.cancel is unavailable', async () => {
    const bad = new Response('bad', { status: 503 });
    (bad as unknown as { body?: unknown }).body = undefined;
    const arrayBufferMock = jest.fn().mockResolvedValue(new ArrayBuffer(0));
    (bad as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = arrayBufferMock;
    const good = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    global.fetch = jest.fn().mockResolvedValueOnce(bad as unknown as Response).mockResolvedValueOnce(good as unknown as Response) as unknown as typeof fetch;
    const { upstreamRequest } = await import('@/lib/server/bff');
    const resp = await upstreamRequest({ url: 'https://api.test/cleanup', requestId: 'req-cleanup', timeoutMs: 200, maxTotalTimeMs: 2000, maxAttempts: 2, method: 'GET', headers: {} });
    expect(resp.status).toBe(200);
    expect(arrayBufferMock).toHaveBeenCalled();
  });
});
