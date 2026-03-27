import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - apiClient args get/post', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('get accepts ApiClientOptions as second arg', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/test', { basePath: '/custom' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom/test');
  });

  it('get accepts RequestOptions second and ApiClientOptions third', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/test', { skipCache: true }, { basePath: '/custom2' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom2/test');
  });

  it('post accepts ApiClientOptions as third arg', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.post('/test', { data: 1 }, { basePath: '/custom3' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom3/test');
  });

  it('post accepts RequestOptions and ApiClientOptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.post('/test', { data: 1 }, { skipCache: true }, { basePath: '/custom4' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/custom4/test');
  });
});
