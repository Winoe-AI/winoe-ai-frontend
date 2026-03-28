import {
  NextRequest,
  getSessionNormalizedMock,
  modeForPathMock,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - mode fallback', () => {
  beforeEach(resetProxyTestMocks);

  it('uses modeForPath fallback when login mode is undefined', async () => {
    modeForPathMock.mockReturnValueOnce(undefined);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(
      new NextRequest(new URL('http://localhost/unknown')),
    );
    expect(res?.headers.get('location')).toContain('/auth/login');
    expect(modeForPathMock).toHaveBeenCalled();
  });
});
