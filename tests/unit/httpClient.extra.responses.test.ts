import {
  apiClient,
  resetHttpClientExtraMocks,
  restoreHttpClientExtraEnv,
  responseHelpers,
} from './httpClient.extra.testlib';

describe('httpClient response edge cases', () => {
  beforeEach(() => {
    resetHttpClientExtraMocks();
  });

  afterEach(() => {
    restoreHttpClientExtraEnv();
  });

  it('returns undefined for 204 responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => 'application/json' },
    } as unknown as Response);
    expect(
      await apiClient.get('/no-content', { skipCache: true }),
    ).toBeUndefined();
  });

  it('uses detail array message when request fails', async () => {
    const body = { detail: [{ msg: 'Too long' }] };
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse(body, 422) as unknown as Response,
    );
    await expect(
      apiClient.get('/fail', { skipCache: true }),
    ).rejects.toMatchObject({
      message: 'Too long',
      status: 422,
      details: body,
    });
  });

  it('handles non-json text error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.textResponse('plain failure', 500) as unknown as Response,
    );
    await expect(
      apiClient.get('/text-error', { skipCache: true }),
    ).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });

  it('handles json and text parsing failures gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('invalid JSON');
      },
    } as unknown as Response);
    expect(
      await apiClient.get('/bad-json', { skipCache: true }),
    ).toBeUndefined();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      text: async () => {
        throw new Error('text read failed');
      },
    } as unknown as Response);
    expect(
      await apiClient.get('/bad-text', { skipCache: true }),
    ).toBeUndefined();
  });

  it('extracts detail message and fallback status messages', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse(
        { detail: 'Detailed error message' },
        400,
      ) as unknown as Response,
    );
    await expect(
      apiClient.get('/fail-detail', { skipCache: true }),
    ).rejects.toMatchObject({
      message: 'Detailed error message',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({}, 403) as unknown as Response,
    );
    await expect(
      apiClient.get('/fail-no-detail', { skipCache: true }),
    ).rejects.toMatchObject({
      message:
        'Request blocked by security policy. Please refresh and try again.',
    });
  });

  it('handles network errors with proper error status', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network down'),
    );
    await expect(
      apiClient.get('/network-fail', { skipCache: true }),
    ).rejects.toThrow('Network down');
  });
});
