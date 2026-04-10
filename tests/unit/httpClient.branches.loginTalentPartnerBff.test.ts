import {
  login,
  talentPartnerBffClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - login and talentPartnerBffClient', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('sends correct login request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({
        access_token: 'tok',
        token_type: 'bearer',
      }) as unknown as Response,
    );
    const result = await login({ email: 'test@example.com', password: 'pass' });
    expect(result.access_token).toBe('tok');
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
  });

  it('uses /api base path', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
    );
    await talentPartnerBffClient.get('/dashboard', { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/dashboard');
  });

  it('supports post/put/patch/delete methods', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ created: true }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ updated: true }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ patched: true }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ deleted: true }) as unknown as Response,
      );

    await talentPartnerBffClient.post(
      '/trials',
      { title: 'New' },
      { skipCache: true },
    );
    await talentPartnerBffClient.put(
      '/trials/1',
      { title: 'Updated' },
      { skipCache: true },
    );
    await talentPartnerBffClient.patch(
      '/trials/1',
      { status: 'active' },
      { skipCache: true },
    );
    await talentPartnerBffClient.delete('/trials/1', { skipCache: true });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
    expect((global.fetch as jest.Mock).mock.calls[1][1].method).toBe('PUT');
    expect((global.fetch as jest.Mock).mock.calls[2][1].method).toBe('PATCH');
    expect((global.fetch as jest.Mock).mock.calls[3][1].method).toBe('DELETE');
  });
});
