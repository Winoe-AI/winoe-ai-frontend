import {
  listTrialCandidateCompare,
  listTrialCandidates,
  mockedTalentPartnerGet,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi candidate list and compare', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('dedupes in-flight candidate requests and uses cache TTL', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockedTalentPartnerGet.mockReturnValueOnce(
      pending.then((data) => ({ ok: true, data })) as Promise<unknown>,
    );
    const first = listTrialCandidates('sim_1');
    const second = listTrialCandidates('sim_1');
    expect(mockedTalentPartnerGet).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    resolveFetch([]);
    await first;

    mockedTalentPartnerGet.mockResolvedValueOnce([
      { candidate_session_id: 1, status: 'not_started' },
    ]);
    const cachedFirst = await listTrialCandidates('sim_2');
    const cachedSecond = await listTrialCandidates('sim_2');
    expect(cachedFirst).toHaveLength(1);
    expect(cachedSecond).toHaveLength(1);
    expect(mockedTalentPartnerGet).toHaveBeenCalledTimes(2);
  });

  it('clears candidate cache on error and retries', async () => {
    mockedTalentPartnerGet.mockRejectedValueOnce(new Error('fail'));
    await expect(listTrialCandidates('sim_3')).rejects.toThrow('fail');
    mockedTalentPartnerGet.mockResolvedValueOnce([]);
    await listTrialCandidates('sim_3');
    expect(mockedTalentPartnerGet).toHaveBeenCalledTimes(2);
  });

  it('calls compare endpoint and normalizes rows', async () => {
    mockedTalentPartnerGet.mockResolvedValueOnce([
      {
        candidate_session_id: 12,
        candidate: { name: 'Alex', email: 'alex@example.com' },
        status: 'completed',
        winoe_report_status: 'ready',
        overall_winoe_score: 76,
        recommendation: 'lean_hire',
      },
    ]);
    const rows = await listTrialCandidateCompare('sim_22');
    expect(mockedTalentPartnerGet).toHaveBeenCalledWith(
      '/trials/sim_22/candidates/compare',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(rows).toEqual([
      expect.objectContaining({
        candidateSessionId: '12',
        candidateLabel: 'Alex',
        winoeReportStatus: 'ready',
        overallWinoeScore: 0.76,
      }),
    ]);
  });

  it('returns empty compare list for blank trial id', async () => {
    expect(await listTrialCandidateCompare('   ')).toEqual([]);
    expect(mockedTalentPartnerGet).not.toHaveBeenCalled();
  });
});
