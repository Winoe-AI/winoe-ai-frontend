import {
  NextResponse,
  ensureAccessToken,
  getAccessToken,
  getSessionNormalized,
  resetBffTestState,
  restoreBffEnv,
} from './bff.testlib';

describe('bff ensureAccessToken', () => {
  const originalDebugAuth = process.env.TENON_DEBUG_AUTH;

  beforeEach(() => {
    resetBffTestState();
    delete process.env.TENON_DEBUG_AUTH;
  });

  afterEach(() => {
    if (originalDebugAuth === undefined) delete process.env.TENON_DEBUG_AUTH;
    else process.env.TENON_DEBUG_AUTH = originalDebugAuth;
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('returns 401 NextResponse when no session exists', async () => {
    getSessionNormalized.mockResolvedValue(null);
    const res = await ensureAccessToken();
    expect(res).toBeInstanceOf(NextResponse);
    if (res instanceof NextResponse) expect(res.status).toBe(401);
  });

  it('returns 401 NextResponse when token retrieval fails', async () => {
    getSessionNormalized.mockResolvedValue({ user: { sub: 'x' } });
    getAccessToken.mockRejectedValue(new Error('boom'));
    const res = await ensureAccessToken();
    expect(res).toBeInstanceOf(NextResponse);
    if (res instanceof NextResponse) {
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ message: 'Not authenticated' });
    }
  });

  it('logs debug output when no session and debug auth is enabled', async () => {
    process.env.TENON_DEBUG_AUTH = 'true';
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    getSessionNormalized.mockResolvedValue(null);
    const res = await ensureAccessToken();
    expect(res).toBeInstanceOf(NextResponse);
    expect(debugSpy).toHaveBeenCalledWith('[auth] no session available');
    debugSpy.mockRestore();
  });

  it('returns 403 when required permission is missing', async () => {
    process.env.TENON_DEBUG_AUTH = 'true';
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    getSessionNormalized.mockResolvedValue({
      user: { sub: 'x', permissions: [] },
    });
    const res = await ensureAccessToken('recruiter:access');
    expect(res).toBeInstanceOf(NextResponse);
    if (res instanceof NextResponse) expect(res.status).toBe(403);
    expect(debugSpy).toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('returns access token payload when session and token are present', async () => {
    getSessionNormalized.mockResolvedValue({ user: { sub: 'x' } });
    getAccessToken.mockResolvedValue('token-123');
    await expect(ensureAccessToken()).resolves.toEqual({
      accessToken: 'token-123',
    });
  });
});
