import {
  inviteCandidate,
  mockTalentPartnerRequest,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi inviteCandidate', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('posts invite request with candidate fields', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: {
        candidateSessionId: 'cs_1',
        token: 'tok_1',
        inviteUrl: 'http://localhost:3000/candidate/session/tok_1',
        outcome: 'created',
      },
      requestId: null,
    });
    await inviteCandidate('sim_1', 'Jane Doe', 'jane@example.com');
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials/sim_1/invite',
      {
        method: 'POST',
        body: { candidateName: 'Jane Doe', inviteEmail: 'jane@example.com' },
      },
    );
  });

  it('normalizes camelCase and snake_case invite responses', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: {
        candidateSessionId: 'cs_1',
        token: 'tok_1',
        inviteUrl: 'http://localhost:3000/candidate/session/tok_1',
        outcome: 'created',
      },
      requestId: null,
    });
    expect(
      await inviteCandidate('sim_1', 'Jane Doe', 'jane@example.com'),
    ).toEqual({
      candidateSessionId: 'cs_1',
      token: 'tok_1',
      inviteUrl: 'http://localhost:3000/candidate/session/tok_1',
      outcome: 'created',
    });
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: {
        candidate_session_id: 'cs_2',
        token: 'tok_2',
        invite_url: 'http://localhost:3000/candidate/session/tok_2',
      },
      requestId: null,
    });
    expect(
      await inviteCandidate('sim_2', 'Jane Doe', 'jane@example.com'),
    ).toEqual({
      candidateSessionId: 'cs_2',
      token: 'tok_2',
      inviteUrl: 'http://localhost:3000/candidate/session/tok_2',
      outcome: 'created',
    });
  });

  it('builds inviteUrl fallback when missing and window undefined', async () => {
    const globalAny = globalThis as Record<string, unknown>;
    const originalWindow = globalAny.window as Window | undefined;
    delete globalAny.window;
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { candidate_session_id: 'cs_3', token: 'tok_3', invite_url: '' },
      requestId: null,
    });
    const result = await inviteCandidate(
      'sim_3',
      'Jane Doe',
      'jane@example.com',
    );
    expect(result.inviteUrl).toBe('/candidate/session/tok_3');
    expect(result.outcome).toBe('created');
    if (originalWindow) globalAny.window = originalWindow;
  });

  it('returns blanks for invalid response or invalid inputs', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: 'not-an-object',
      requestId: null,
    });
    expect(
      await inviteCandidate('sim_3', 'Jane Doe', 'jane@example.com'),
    ).toEqual({
      candidateSessionId: '',
      token: '',
      inviteUrl: '',
      outcome: 'created',
    });
    expect(await inviteCandidate('   ', '   ', '   ')).toEqual({
      candidateSessionId: '',
      token: '',
      inviteUrl: '',
      outcome: 'created',
    });
    expect(
      await inviteCandidate(
        { bad: true } as unknown as string,
        { value: 'Name' } as unknown as string,
        { value: 'Email' } as unknown as string,
      ),
    ).toEqual({
      candidateSessionId: '',
      token: '',
      inviteUrl: '',
      outcome: 'created',
    });
    expect(mockTalentPartnerRequest).toHaveBeenCalledTimes(1);
  });
});
