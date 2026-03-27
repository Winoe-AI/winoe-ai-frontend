import { extractInviteToken } from './CandidateDashboardPage.extra.testlib';

describe('extractInviteToken', () => {
  it('extracts tokens with case-insensitive route segments', () => {
    expect(extractInviteToken('http://app.com/CANDIDATE/SESSION/ABC123')).toBe('ABC123');
    expect(extractInviteToken('/CANDIDATE-SESSIONS/XYZ789')).toBe('XYZ789');
  });

  it('extracts trailing segment for simple paths', () => {
    expect(extractInviteToken('simpletoken')).toBe('simpletoken');
    expect(extractInviteToken('path/token')).toBe('token');
    expect(extractInviteToken('/path/token/')).toBe('');
  });
});
