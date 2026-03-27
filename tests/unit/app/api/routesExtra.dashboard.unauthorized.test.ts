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

describe('API routes extra coverage - dashboard unauthorized', () => {
  afterEach(resetRoutesExtraMocks);

  it('returns forbidden when simulations unauthorized', async () => {
    mockRequireBffAuth.mockResolvedValue({ ok: true, accessToken: 'token-dash', cookies: [], requestId: 'req-extra' });
    mockUpstreamRequest
      .mockResolvedValueOnce(responseWithJson(200, {}))
      .mockResolvedValueOnce(responseWithJson(401, {}));
    mockParseUpstreamBody.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    const { GET } = await import(modulePath);
    markMetadataCovered(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(401);
    expect(result.headers.get('x-upstream')).toBe('401');
  });

  it('returns unauthorized when profile is forbidden', async () => {
    mockRequireBffAuth.mockResolvedValue({ ok: true, accessToken: 'token-dash', cookies: [], requestId: 'req-extra' });
    mockUpstreamRequest
      .mockResolvedValueOnce(responseWithJson(401, { message: 'forbidden' }))
      .mockResolvedValueOnce(responseWithJson(200, []));
    mockParseUpstreamBody
      .mockResolvedValueOnce({ message: 'forbidden' })
      .mockResolvedValueOnce([]);

    const { GET } = await import(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(401);
    expect(result.headers.get('x-upstream')).toBe('401');
  });
});
