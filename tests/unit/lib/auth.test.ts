import { getAuthToken, setAuthToken } from '@/lib/auth';

describe('auth token helpers', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // @ts-expect-error reset window if modified
    global.window = originalWindow;
  });

  it('returns null on server without window', () => {
    // @ts-expect-error simulate server
    delete global.window;
    expect(getAuthToken()).toBeNull();
  });

  it('always returns null and setAuthToken is a no-op', () => {
    setAuthToken('token123');
    expect(getAuthToken()).toBeNull();
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('does nothing on server when setting token without window', () => {
    const originalWindow = global.window;
    // @ts-expect-error simulate server
    delete global.window;
    // Should not throw
    expect(() => setAuthToken('test')).not.toThrow();
    // @ts-expect-error restore window
    global.window = originalWindow;
  });
});
