import {
  apiClient,
  isSameOriginRequest,
  talentPartnerBffClient,
} from '@/platform/api-client/client';
import { responseHelpers } from '../setup';

describe('httpClient', () => {
  const realFetch = global.fetch;
  const originalApiBase = process.env.NEXT_PUBLIC_WINOE_API_BASE_URL;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset?.();
    process.env.NEXT_PUBLIC_WINOE_API_BASE_URL = originalApiBase;
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  it('detects same-origin requests safely', () => {
    expect(isSameOriginRequest('/api/test')).toBe(true);
    expect(isSameOriginRequest('https://example.com/api')).toBe(false);
  });

  it('falls back to relative check when URL parsing fails', () => {
    expect(isSameOriginRequest('http://[::1')).toBe(false);
    expect(isSameOriginRequest('/relative/path')).toBe(true);
  });

  it('falls back to relative check on server without window', () => {
    const originalWindow = (global as unknown as { window?: unknown }).window;
    const globalWindow = global as unknown as { window?: unknown };
    delete globalWindow.window;

    expect(isSameOriginRequest('/api/ok')).toBe(true);
    expect(isSameOriginRequest('https://other.com/foo')).toBe(false);
    expect(isSameOriginRequest('//other.com/foo')).toBe(false);

    (global as unknown as { window?: unknown }).window = originalWindow;
  });

  it('includes credentials for same-origin BFF calls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
    );

    await talentPartnerBffClient.get('/trials');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/trials',
      expect.objectContaining({
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    );
  });

  it('rejects absolute BFF origins to enforce same-origin requests', async () => {
    await expect(
      apiClient.get('/candidate/invites', undefined, {
        basePath: 'https://backend.example.com/api',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BFF_UNSAFE_REQUEST',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
