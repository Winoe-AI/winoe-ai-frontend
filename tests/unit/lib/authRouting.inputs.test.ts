import { buildReturnTo, sanitizeReturnTo } from '@/platform/auth/routing';

describe('auth/routing input handling', () => {
  it('handles nullish and empty inputs', () => {
    expect(sanitizeReturnTo(null)).toBe('/');
    expect(sanitizeReturnTo(undefined)).toBe('/');
    expect(sanitizeReturnTo('')).toBe('/');
  });

  it('rejects auth/hash and relative variants', () => {
    expect(sanitizeReturnTo('/auth#foo')).toBe('/');
    expect(sanitizeReturnTo('/api/auth#bar')).toBe('/');
    expect(sanitizeReturnTo('relative/path')).toBe('/');
    expect(sanitizeReturnTo('dashboard')).toBe('/');
  });

  it('rejects protocol-like and javascript variants', () => {
    expect(sanitizeReturnTo('/path://something')).toBe('/');
    expect(sanitizeReturnTo('/javascript:void(0)')).toBe('/');
  });

  it('buildReturnTo handles NextRequest-like object', () => {
    const nextRequest = {
      nextUrl: { pathname: '/candidate/test', search: '?id=123' },
    };
    expect(buildReturnTo(nextRequest as never)).toBe('/candidate/test?id=123');
  });

  it('buildReturnTo uses window.location when input is missing', () => {
    const originalWindow = global.window;
    Object.defineProperty(global, 'window', {
      value: { location: { pathname: '/dashboard', search: '?tab=overview' } },
      configurable: true,
    });
    try {
      expect(buildReturnTo()).toBe('/dashboard?tab=overview');
    } finally {
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        configurable: true,
      });
    }
  });

  it('buildReturnTo handles Location without search', () => {
    expect(buildReturnTo({ pathname: '/simple' } as Location)).toBe('/simple');
  });
});
