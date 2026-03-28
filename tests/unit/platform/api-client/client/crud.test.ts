import {
  buildApiMethod,
  buildApiMethodWithBody,
  buildScopedClient,
} from '@/platform/api-client/client/crud';

const authedRequestMock = jest.fn();
const splitArgsMock = jest.fn();

jest.mock('@/platform/api-client/client/authRequest', () => ({
  authedRequest: (...args: unknown[]) => authedRequestMock(...args),
  splitArgs: (...args: unknown[]) => splitArgsMock(...args),
}));

describe('crud client helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    splitArgsMock.mockReturnValue({
      requestOptions: { cache: 'no-store' },
      clientOptions: undefined,
    });
    authedRequestMock.mockResolvedValue({ ok: true });
  });

  it('buildScopedClient.get applies defaults when clientOptions are absent', async () => {
    const client = buildScopedClient({ basePath: '/api', skipAuth: true });

    await client.get('/dashboard', { cache: 'no-store' });

    expect(splitArgsMock).toHaveBeenCalledWith(
      '/dashboard',
      { cache: 'no-store' },
      undefined,
    );
    expect(authedRequestMock).toHaveBeenCalledWith(
      '/dashboard',
      { cache: 'no-store', method: 'GET', body: undefined },
      { basePath: '/api', skipAuth: true },
    );
  });

  it('buildScopedClient.post forwards body and explicit client options', async () => {
    splitArgsMock.mockReturnValue({
      requestOptions: { headers: { 'x-id': '1' } },
      clientOptions: { basePath: '/custom', skipAuth: false },
    });

    const client = buildScopedClient({ basePath: '/api', skipAuth: true });
    await client.post('/simulations', { title: 'Test' });

    expect(authedRequestMock).toHaveBeenCalledWith(
      '/simulations',
      {
        headers: { 'x-id': '1' },
        method: 'POST',
        body: { title: 'Test' },
      },
      { basePath: '/custom', skipAuth: false },
    );
  });

  it('buildApiMethod delegates GET/DELETE calls through splitArgs+authedRequest', async () => {
    const get = buildApiMethod('GET');
    await get('/candidate/invites', { cacheTtlMs: 5000 }, { basePath: '/api' });

    expect(splitArgsMock).toHaveBeenCalledWith(
      '/candidate/invites',
      { cacheTtlMs: 5000 },
      { basePath: '/api' },
    );
    expect(authedRequestMock).toHaveBeenCalledWith(
      '/candidate/invites',
      { cache: 'no-store', method: 'GET', body: undefined },
      undefined,
    );
  });

  it('buildApiMethodWithBody delegates PATCH calls with body payload', async () => {
    splitArgsMock.mockReturnValue({
      requestOptions: { credentials: 'include' },
      clientOptions: { basePath: '/api', skipAuth: true },
    });

    const patch = buildApiMethodWithBody('PATCH');
    await patch('/tasks/1', { status: 'done' }, { cache: 'no-store' });

    expect(authedRequestMock).toHaveBeenCalledWith(
      '/tasks/1',
      {
        credentials: 'include',
        method: 'PATCH',
        body: { status: 'done' },
      },
      { basePath: '/api', skipAuth: true },
    );
  });
});
