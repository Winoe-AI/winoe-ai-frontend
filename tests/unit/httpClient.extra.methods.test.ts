import {
  apiClient,
  resetHttpClientExtraMocks,
  restoreHttpClientExtraEnv,
  responseHelpers,
} from './httpClient.extra.testlib';

describe('httpClient method and body behavior', () => {
  beforeEach(() => {
    resetHttpClientExtraMocks();
  });

  afterEach(() => {
    restoreHttpClientExtraEnv();
  });

  it('sends FormData bodies without stringifying', async () => {
    const form = new FormData();
    form.append('field', 'value');
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.post('/form', form, { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(form);
  });

  it('uses put, patch, and delete methods correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);

    await apiClient.put('/resource/1', { name: 'updated' }, { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PUT');

    await apiClient.patch('/resource/1', { field: 'new' }, { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[1][1].method).toBe('PATCH');

    await apiClient.delete('/resource/1', { skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[2][1].method).toBe('DELETE');
  });

  it('uses provided cache option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/cached', { cache: 'force-cache', skipCache: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].cache).toBe('force-cache');
  });
});
