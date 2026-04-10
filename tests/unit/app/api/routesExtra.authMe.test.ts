import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockForwardJson,
  mockMergeResponseCookies,
  mockRequireBffAuth,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - auth/me route', () => {
  const modulePath = '@/app/api/auth/me/route';

  afterEach(resetRoutesExtraMocks);

  it('returns talent_partner auth failure with request id', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ message: 'nope' }, { status: 401 }),
      cookies: [],
    });
    const { GET } = await import(modulePath);
    markMetadataCovered(modulePath);

    const result = await GET(new NextRequest('http://localhost/api/auth/me'));
    expect(result.status).toBe(401);
    expect(result.headers.get('x-request-id')).toBe('req-extra');
    expect(mockMergeResponseCookies).toHaveBeenCalled();
  });

  it('forwards talent_partner auth success', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'tok-me',
      cookies: [],
    });
    mockForwardJson.mockResolvedValue(NextResponse.json({ ok: true }));
    const { GET } = await import(modulePath);
    markMetadataCovered(modulePath);

    const result = await GET(new NextRequest('http://localhost/api/auth/me'));
    expect(result.status).toBe(200);
    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/auth/me',
        accessToken: 'tok-me',
        requestId: 'req-extra',
      }),
    );
  });
});
