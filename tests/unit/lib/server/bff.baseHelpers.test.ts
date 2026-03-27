import {
  NextResponse,
  forwardJson,
  getBackendBaseUrl,
  getSessionNormalized,
  parseUpstreamBody,
  resetBffTestState,
  restoreBffEnv,
} from './bff.testlib';

describe('bff base helpers', () => {
  beforeEach(() => {
    resetBffTestState();
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('strips trailing api segment and slashes from backend base URL', () => {
    process.env.TENON_BACKEND_BASE_URL = 'http://api.test/api///';
    expect(getBackendBaseUrl()).toBe('http://api.test');
  });

  it('parses upstream json/text bodies safely', async () => {
    const jsonRes = new Response(JSON.stringify({ message: 'hello' }), {
      headers: { 'content-type': 'application/json' },
    });
    await expect(parseUpstreamBody(jsonRes)).resolves.toEqual({
      message: 'hello',
    });
    const textRes = new Response('plain text', {
      headers: { 'content-type': 'text/plain' },
    });
    await expect(parseUpstreamBody(textRes)).resolves.toBe('plain text');
    const badText = {
      headers: { get: () => 'text/plain' },
      text: async () => {
        throw new Error('fail');
      },
    } as unknown as Response;
    await expect(parseUpstreamBody(badText)).resolves.toBeUndefined();
  });

  it('forwards JSON request with auth and returns upstream status/body', async () => {
    process.env.TENON_BACKEND_BASE_URL = 'http://backend.example.com';
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const resp = await forwardJson({
      path: '/api/test',
      method: 'POST',
      headers: { 'X-Test': 'yes' },
      body: { hello: 'world' },
      accessToken: 'abc',
      cache: 'no-cache',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.example.com/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
        cache: 'no-cache',
        redirect: 'manual',
      }),
    );
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer abc');
    expect(headers.get('x-test')).toBe('yes');
    expect(resp.status).toBe(201);
    expect(await resp.json()).toEqual({ ok: true });
  });

  it('withAuthGuard short-circuits when auth is missing', async () => {
    getSessionNormalized.mockResolvedValue(null);
    const { withAuthGuard } = await import('@/platform/server/bff');
    const result = await withAuthGuard(async () =>
      NextResponse.json({ ok: true }),
    );
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) expect(result.status).toBe(401);
  });
});
