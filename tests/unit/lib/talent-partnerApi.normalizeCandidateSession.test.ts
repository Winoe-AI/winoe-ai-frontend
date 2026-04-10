import {
  normalizeCandidateSession,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi normalizeCandidateSession', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('normalizes snake_case fields and inviteUrl fallback', () => {
    const globalAny = globalThis as Record<string, unknown>;
    const originalWindow = globalAny.window as Window | undefined;
    delete globalAny.window;
    const result = normalizeCandidateSession({
      candidate_session_id: 12,
      invite_email: 'test@example.com',
      candidate_name: 'Test User',
      status: 'not_started',
      invite_token: 'tok_12',
      invite_url: '',
      invite_email_status: 'sent',
      invite_email_sent_at: '2025-01-01T00:00:00Z',
      report_ready: true,
      report_id: 'r-12',
    });
    expect(result.candidateSessionId).toBe(12);
    expect(result.inviteUrl).toBe('/candidate/session/tok_12');
    expect(result.inviteEmailStatus).toBe('sent');
    expect(result.reportReady).toBe(true);
    expect(result.reportId).toBe('r-12');
    if (originalWindow) globalAny.window = originalWindow;
  });

  it('uses window origin for invite fallback and normalizes verification/progress', () => {
    const globalAny = globalThis as Record<string, unknown>;
    const originalWindow = globalAny.window as Window | undefined;
    globalAny.window = { location: { origin: 'https://app.test' } } as Window;
    const result = normalizeCandidateSession({
      candidateSessionId: '7',
      inviteEmail: 'test@example.com',
      candidateName: 'Test User',
      sessionStatus: 'in_progress',
      inviteToken: 'tok_7',
      inviteUrl: '',
      email_verified: true,
      progress: { current: '1', total: '3' },
    });
    expect(result.inviteUrl).toBe('https://app.test/candidate/session/tok_7');
    expect(result.verified).toBe(true);
    expect(result.dayProgress).toEqual({ current: 1, total: 3 });
    if (originalWindow) globalAny.window = originalWindow;
    else delete globalAny.window;
  });

  it('handles null/invalid payloads safely', () => {
    const empty = normalizeCandidateSession(null);
    expect(empty.candidateSessionId).toBe(0);
    expect(empty.status).toBe('not_started');
    const invalid = normalizeCandidateSession({
      id: 'NaN',
      progress: { current: 'x', total: 'y' },
    });
    expect(invalid.candidateSessionId).toBe(0);
    expect(invalid.dayProgress).toBeNull();
  });
});
