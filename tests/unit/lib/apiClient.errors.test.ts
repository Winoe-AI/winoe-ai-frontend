import { apiClient, fetchMock, login, resetApiClientMocks, responseHelpers } from './apiClient.testlib';

describe('apiClient error behavior', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  it('extracts error messages from JSON and text responses', async () => {
    fetchMock.mockResolvedValueOnce(responseHelpers.jsonResponse({ detail: [{ msg: 'Invalid password' }] }, 422));
    await expect(login({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({ message: 'Invalid password', status: 422 });

    fetchMock.mockResolvedValueOnce(responseHelpers.textResponse('Internal error', 500, { 'content-type': 'text/plain' }));
    await expect(apiClient.get('/oops')).rejects.toMatchObject({ message: 'Request failed with status 500', status: 500 });
  });

  it('rejects unsafe BFF URL and request mode', async () => {
    await expect(apiClient.get('https://evil.example/api/backend/jobs')).rejects.toMatchObject({ status: 400, code: 'BFF_UNSAFE_REQUEST' });
    await expect(apiClient.get('/jobs', { mode: 'no-cors' as RequestMode })).rejects.toMatchObject({ status: 400, code: 'BFF_UNSAFE_REQUEST' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes BFF 401/403 messages to safe defaults', async () => {
    fetchMock.mockResolvedValueOnce(responseHelpers.jsonResponse({ detail: 'raw auth detail' }, 401)).mockResolvedValueOnce(responseHelpers.jsonResponse({ detail: 'raw forbidden detail' }, 403));

    await expect(apiClient.get('/auth-required')).rejects.toMatchObject({ status: 401, code: 'BFF_AUTH_REQUIRED', message: 'Authentication required. Please sign in again.' });
    await expect(apiClient.post('/forbidden', {})).rejects.toMatchObject({ status: 403, code: 'BFF_FORBIDDEN', message: 'Request blocked by security policy. Please refresh and try again.' });
  });
});
