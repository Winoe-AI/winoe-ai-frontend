import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - apiClient args put/patch/delete', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('put accepts ApiClientOptions as third arg', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.put('/test', { data: 1 }, { basePath: '/custom5' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom5/test');
  });

  it('put accepts RequestOptions and ApiClientOptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.put('/test', { data: 1 }, { skipCache: true }, { basePath: '/custom6' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom6/test');
  });

  it('patch accepts ApiClientOptions as third arg', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.patch('/test', { data: 1 }, { basePath: '/custom7' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom7/test');
  });

  it('patch accepts RequestOptions and ApiClientOptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.patch('/test', { data: 1 }, { skipCache: true }, { basePath: '/custom8' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom8/test');
  });

  it('delete accepts ApiClientOptions as second arg', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.delete('/test', { basePath: '/custom9' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom9/test');
  });

  it('delete accepts RequestOptions and ApiClientOptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.delete('/test', { skipCache: true }, { basePath: '/custom10' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom10/test');
  });
});
