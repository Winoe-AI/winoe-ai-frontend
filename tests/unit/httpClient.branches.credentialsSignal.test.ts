import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - credentials and signal', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('uses same-origin credentials for same-origin requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/same-origin', { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].credentials).toBe('same-origin');
  });

  it('uses provided credentials option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/custom-creds', { skipCache: true, credentials: 'same-origin' });
    expect((global.fetch as jest.Mock).mock.calls[0][1].credentials).toBe('same-origin');
  });

  it('passes abort signal to fetch', async () => {
    const controller = new AbortController();
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/with-signal', { skipCache: true, signal: controller.signal });
    expect((global.fetch as jest.Mock).mock.calls[0][1].signal).toBe(controller.signal);
  });
});
