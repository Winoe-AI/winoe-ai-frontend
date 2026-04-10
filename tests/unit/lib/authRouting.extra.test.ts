/**
 * Additional tests for lib/auth/routing to close coverage gaps
 */
import {
  buildLoginUrl,
  buildNotAuthorizedUrl,
  modeForPath,
  sanitizeReturnTo,
} from '@/platform/auth/routing';
describe('auth/routing extra coverage', () => {
  describe('modeForPath', () => {
    it('returns candidate for /candidate-sessions paths', () => {
      expect(modeForPath('/candidate-sessions/123')).toBe('candidate');
      expect(modeForPath('/candidate-sessions')).toBe('candidate');
    });
    it('returns candidate for /candidate paths', () => {
      expect(modeForPath('/candidate/dashboard')).toBe('candidate');
      expect(modeForPath('/candidate')).toBe('candidate');
    });
    it('returns talent_partner for other paths', () => {
      expect(modeForPath('/dashboard')).toBe('talent_partner');
      expect(modeForPath('/trials')).toBe('talent_partner');
      expect(modeForPath('/')).toBe('talent_partner');
    });
  });
  describe('buildNotAuthorizedUrl', () => {
    it('builds URL with mode and returnTo', () => {
      const url = buildNotAuthorizedUrl('talent_partner', '/dashboard');
      expect(url).toBe(
        '/not-authorized?mode=talent_partner&returnTo=%2Fdashboard',
      );
    });
    it('builds URL for candidate mode', () => {
      const url = buildNotAuthorizedUrl('candidate', '/candidate/home');
      expect(url).toBe(
        '/not-authorized?mode=candidate&returnTo=%2Fcandidate%2Fhome',
      );
    });
    it('builds URL without returnTo', () => {
      const url = buildNotAuthorizedUrl('talent_partner');
      expect(url).toBe('/not-authorized?mode=talent_partner&returnTo=%2F');
    });
  });
  describe('buildLoginUrl edge cases', () => {
    it('handles URL input', () => {
      const url = new URL('http://example.com/candidate/test?foo=bar');
      const result = buildLoginUrl('candidate', url);
      expect(result).toContain('mode=candidate');
      expect(result).toContain('returnTo=%2Fcandidate%2Ftest%3Ffoo%3Dbar');
    });
    it('handles NextRequest-like input', () => {
      const req = {
        nextUrl: {
          pathname: '/dashboard',
          search: '?page=1',
        },
      };
      const result = buildLoginUrl('talent_partner', req as never);
      expect(result).toContain('mode=talent_partner');
      expect(result).toContain('returnTo=%2Fdashboard%3Fpage%3D1');
    });
  });
  describe('sanitizeReturnTo edge cases', () => {
    it('handles double-encoded backslash', () => {
      // %5C is \, %255C is encoded %5C
      expect(sanitizeReturnTo('/%255Ctest')).toBe('/');
    });
    it('handles encoded newlines', () => {
      // %0d is \r, %0a is \n
      expect(sanitizeReturnTo('/test%0d')).toBe('/');
      expect(sanitizeReturnTo('/test%0a')).toBe('/');
    });
    it('handles single-encoded path that becomes protocol', () => {
      // %3A is :
      expect(sanitizeReturnTo('/http%3A//evil.com')).toBe('/');
    });
    it('handles encoded //', () => {
      // First decode: //evil.com (unsafe due to //)
      expect(sanitizeReturnTo('%2F%2Fevil.com')).toBe('/');
    });
    it('handles triple-encoded paths', () => {
      // %252F%252F -> %2F%2F -> //
      expect(sanitizeReturnTo('%252F%252Fevil.com')).toBe('/');
    });
    it('allows valid paths with query strings and fragments', () => {
      expect(sanitizeReturnTo('/dashboard?tab=overview#section')).toBe(
        '/dashboard?tab=overview#section',
      );
    });
    it('rejects /api/auth variants', () => {
      expect(sanitizeReturnTo('/api/auth')).toBe('/');
      expect(sanitizeReturnTo('/api/auth/login')).toBe('/');
      expect(sanitizeReturnTo('/api/auth?redirect')).toBe('/');
    });
  });
});
