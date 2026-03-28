import { extractInviteToken } from '@/features/candidate/portal/CandidateDashboardPage';

describe('extractInviteToken core paths', () => {
  it('returns empty string for empty input', () => {
    expect(extractInviteToken('')).toBe('');
    expect(extractInviteToken('   ')).toBe('');
  });

  it('extracts token from canonical candidate session URLs', () => {
    expect(extractInviteToken('http://app.com/candidate/session/abc123')).toBe(
      'abc123',
    );
    expect(extractInviteToken('/candidate/session/token456')).toBe('token456');
  });

  it('extracts token from legacy candidate-sessions URLs', () => {
    expect(
      extractInviteToken('http://app.com/candidate-sessions/legacy123'),
    ).toBe('legacy123');
    expect(extractInviteToken('/candidate-sessions/tok789')).toBe('tok789');
  });

  it('extracts trailing token and strips query/hash suffixes', () => {
    expect(extractInviteToken('/path/to/token123')).toBe('token123');
    expect(extractInviteToken('/candidate/session/abc?foo=bar')).toBe('abc');
    expect(extractInviteToken('/candidate/session/abc#anchor')).toBe('abc');
  });
});
