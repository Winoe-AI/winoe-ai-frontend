import {
  MockNextRequest,
  MockNextResponse,
  forwardJsonMock,
  resetTalentPartnerRouteMocks,
  restoreTalentPartnerRouteEnv,
} from './talent-partnerRoutes.testlib';

describe('talent_partner submissions routes', () => {
  beforeEach(() => {
    resetTalentPartnerRouteMocks();
    forwardJsonMock.mockResolvedValue(new MockNextResponse({ items: [] }));
  });

  afterAll(() => {
    restoreTalentPartnerRouteEnv();
  });

  it('builds query string for submissions list', async () => {
    const { GET } = await import('@/app/api/submissions/route');
    const req = new MockNextRequest(
      'http://localhost/api/submissions?candidateSessionId=9',
    );
    const resp = await GET(req);
    expect(resp.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/submissions?candidateSessionId=9',
      }),
    );
  });

  it('returns error response when submissionId is missing', async () => {
    const { GET } = await import('@/app/api/submissions/[submissionId]/route');
    const resp = await GET(new MockNextRequest('http://x'), {
      params: Promise.resolve({ submissionId: '' }),
    });
    expect(resp.status).toBe(500);
    expect(resp.body).toMatchObject({ message: 'Bad request' });
  });

  it('forwards submission detail when id is present', async () => {
    forwardJsonMock.mockResolvedValue(new MockNextResponse({ ok: true }));
    const { GET } = await import('@/app/api/submissions/[submissionId]/route');
    const resp = await GET(new MockNextRequest('http://x'), {
      params: Promise.resolve({ submissionId: '42' }),
    });
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/submissions/42' }),
    );
    expect(
      (forwardJsonMock.mock.calls[0]?.[0] as { accessToken?: string })
        ?.accessToken,
    ).toBe('token-123');
    expect(resp.headers.get('x-winoe-bff')).toBe('submission-detail');
  });
});
