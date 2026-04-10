import {
  MockNextRequest,
  MockNextResponse,
  forwardJsonMock,
  resetTalentPartnerRouteMocks,
  restoreTalentPartnerRouteEnv,
} from './talent-partnerRoutes.testlib';

describe('talent_partner trials routes', () => {
  beforeEach(() => {
    resetTalentPartnerRouteMocks();
    forwardJsonMock.mockResolvedValue(new MockNextResponse({ ok: true }));
  });

  afterAll(() => {
    restoreTalentPartnerRouteEnv();
  });

  it('GET /api/trials forwards with auth', async () => {
    const { GET } = await import('@/app/api/trials/route');
    const resp = await GET(new MockNextRequest('http://localhost/api/sim'));
    expect(resp.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/trials',
        accessToken: 'token-123',
        requestId: 'req-1',
      }),
    );
  });

  it('POST /api/trials returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/trials/route');
    const req = new MockNextRequest('http://localhost/api/sim', {
      method: 'POST',
      bodyText: 'not-json',
    });
    const resp = await POST(req, {
      params: Promise.resolve({} as Record<string, never>),
    });
    expect(resp.status).toBe(400);
  });

  it('POST /api/trials forwards parsed body', async () => {
    const { POST } = await import('@/app/api/trials/route');
    const req = new MockNextRequest('http://localhost/api/sim', {
      method: 'POST',
      bodyText: JSON.stringify({ title: 'New Sim' }),
    });
    const resp = await POST(req, {
      params: Promise.resolve({} as Record<string, never>),
    });
    expect(resp.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/trials',
        method: 'POST',
        body: { title: 'New Sim' },
      }),
    );
  });

  it.each([
    ['@/app/api/trials/[id]/route', { id: 'abc 123' }, '/api/trials/abc%20123'],
    [
      '@/app/api/trials/[id]/candidates/route',
      { id: 'trial-9' },
      '/api/trials/trial-9/candidates',
    ],
    [
      '@/app/api/trials/[id]/candidates/compare/route',
      { id: 'trial-9' },
      '/api/trials/trial-9/candidates/compare',
    ],
  ])(
    'forwards %s to expected backend path',
    async (modulePath, params, path) => {
      const { GET } = await import(modulePath);
      await GET(new MockNextRequest('http://x'), {
        params: Promise.resolve(params as Record<string, string>),
      });
      expect(forwardJsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ path }),
      );
    },
  );

  it('POST invite uses empty body when JSON parsing fails', async () => {
    const { POST } = await import('@/app/api/trials/[id]/invite/route');
    const req = new MockNextRequest('http://x', {
      method: 'POST',
      bodyText: 'invalid',
    });
    await POST(req, { params: Promise.resolve({ id: 'trial-1' }) });
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/trials/trial-1/invite',
        body: {},
      }),
    );
  });

  it('resend invite forwards to candidate-specific path', async () => {
    const { POST } =
      await import('@/app/api/trials/[id]/candidates/[candidateSessionId]/invite/resend/route');
    await POST(new MockNextRequest('http://x'), {
      params: Promise.resolve({ id: 'trial-1', candidateSessionId: 'cand-7' }),
    });
    expect(forwardJsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/trials/trial-1/candidates/cand-7/invite/resend',
      }),
    );
  });
});
