import {
  GlobalResponse,
  markMetadataCovered,
  mockParseUpstreamBody,
  resetRoutesBasicMocks,
} from './routesBasic.testlib';

describe('health route', () => {
  beforeEach(() => {
    resetRoutesBasicMocks();
  });

  afterAll(() => {
    markMetadataCovered('@/app/api/health/route.ts');
  });

  it('returns upstream health payload', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new GlobalResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch;

    const mod = await import('@/app/api/health/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    expect(mockParseUpstreamBody).toHaveBeenCalled();
  });

  it('blocks upstream redirects', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new GlobalResponse('', {
        status: 302,
        headers: { location: 'http://example.com' },
      }),
    ) as unknown as typeof fetch;

    const mod = await import('@/app/api/health/route');
    const res = await mod.GET();
    expect(res.status).toBe(502);
    expect(res.headers.get('x-upstream')).toBe('302');
  });

  it('returns failure on fetch errors', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const mod = await import('@/app/api/health/route');
    const res = await mod.GET();
    expect(res.status).toBe(503);

    global.fetch = jest
      .fn()
      .mockRejectedValue('boom') as unknown as typeof fetch;
    const second = await mod.GET();
    expect(second.status).toBe(503);
  });
});
