import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  mockParseUpstreamBody,
  mockRequireBffAuth,
  mockUpstreamRequest,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

const modulePath = '@/app/api/dashboard/route';
const responseWithJson = (
  status: number,
  json: unknown,
  attempts?: number,
  durationMs?: number,
) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    headers: new Map([['content-type', 'application/json']]),
    async arrayBuffer() {
      return new TextEncoder().encode(JSON.stringify(json)).buffer;
    },
    _tenonMeta: attempts
      ? { attempts, durationMs: durationMs ?? 0 }
      : undefined,
  }) as unknown as Response & {
    _tenonMeta?: { attempts: number; durationMs: number };
  };

describe('API routes extra coverage - dashboard success paths', () => {
  afterEach(resetRoutesExtraMocks);

  it('returns dashboard payload on full success', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'token-dash',
      cookies: [],
      requestId: 'req-extra',
    });
    mockUpstreamRequest
      .mockResolvedValueOnce(responseWithJson(200, { name: 'r' }, 1, 5))
      .mockResolvedValueOnce(responseWithJson(200, [], 2, 7));
    mockParseUpstreamBody
      .mockResolvedValueOnce({ name: 'r' })
      .mockResolvedValueOnce([]);

    const { GET } = await import(modulePath);
    markMetadataCovered(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(200);
    expect(result.headers.get('x-tenon-upstream-status-profile')).toBe('200');
    expect(result.headers.get('x-tenon-upstream-status-simulations')).toBe(
      '200',
    );
  });

  it('handles simulations 500 with string message', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'token-dash',
      cookies: [],
      requestId: 'req-extra',
    });
    mockUpstreamRequest
      .mockResolvedValueOnce(responseWithJson(200, {}))
      .mockResolvedValueOnce(responseWithJson(500, 'boom'));
    mockParseUpstreamBody
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce('boom');

    const { GET } = await import(modulePath);
    const result = await GET(new NextRequest('http://localhost/api/dashboard'));
    expect(result.status).toBe(200);
    expect(result.headers.get('x-tenon-upstream-status-simulations')).toBe(
      '500',
    );
  });
});
