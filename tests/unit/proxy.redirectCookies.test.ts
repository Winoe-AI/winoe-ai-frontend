import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - redirect cookie merging', () => {
  beforeEach(resetProxyTestMocks);

  it('merges cookies on redirect responses', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('edge', 'set');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.cookies.getAll().find((c) => c.name === 'edge')?.value).toBe('set');
  });
});
