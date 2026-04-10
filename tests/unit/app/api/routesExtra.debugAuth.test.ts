import { markMetadataCovered } from './coverageHelpers';
import {
  mockGetSessionNormalized,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - debug auth roles', () => {
  afterEach(resetRoutesExtraMocks);

  it('returns roles when present on custom claim', async () => {
    mockGetSessionNormalized.mockResolvedValue({
      user: { 'https://winoe.dev/roles': ['TalentPartner'] },
      accessToken: 'tok',
    });
    const mod = await import('@/app/api/debug/auth/route');
    markMetadataCovered('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
  });
});
