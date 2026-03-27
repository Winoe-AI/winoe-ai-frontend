import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  mockParseUpstreamBody,
  mockRequireBffAuth,
  mockUpstreamRequest,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

const modulePath = '@/app/api/dashboard/route';
const responseWithJson = (status: number, json: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    headers: new Map([['content-type', 'application/json']]),
    async arrayBuffer() {
      return new TextEncoder().encode(JSON.stringify(json)).buffer;
    },
  }) as unknown as Response;

describe('API routes extra coverage - dashboard rejections', () => {
  afterEach(resetRoutesExtraMocks);

  it('handles rejected profile request', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'token-dash',
      cookies: [],
      requestId: 'req-extra',
    });
    mockUpstreamRequest
      .mockRejectedValueOnce(new Error('profile down'))
      .mockResolvedValueOnce(responseWithJson(200, []));
    mockParseUpstreamBody
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ id: 1 }]);

    const { GET } = await import(modulePath);
    markMetadataCovered(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(200);
    expect(result.headers.get('x-upstream')).toBe('502');
  });

  it('handles rejected simulations request', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'token-dash',
      cookies: [],
      requestId: 'req-extra',
    });
    mockUpstreamRequest
      .mockResolvedValueOnce(responseWithJson(200, {}))
      .mockRejectedValueOnce(new Error('sim down'));
    mockParseUpstreamBody.mockResolvedValueOnce({});

    const { GET } = await import(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(200);
    expect(result.headers.get('x-tenon-upstream-status-simulations')).toBe(
      '502',
    );
  });
});
