import { listSimulationCandidateCompare, listSimulationCandidates, mockedRecruiterGet, resetRecruiterApiMocks, restoreRecruiterApiEnv } from './recruiterApi.testlib';

describe('recruiterApi candidate list and compare', () => {
  beforeEach(() => {
    resetRecruiterApiMocks();
  });

  afterEach(() => {
    restoreRecruiterApiEnv();
  });

  it('dedupes in-flight candidate requests and uses cache TTL', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockedRecruiterGet.mockReturnValueOnce(pending.then((data) => ({ ok: true, data })) as Promise<unknown>);
    const first = listSimulationCandidates('sim_1');
    const second = listSimulationCandidates('sim_1');
    expect(mockedRecruiterGet).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    resolveFetch([]);
    await first;

    mockedRecruiterGet.mockResolvedValueOnce([{ candidate_session_id: 1, status: 'not_started' }]);
    const cachedFirst = await listSimulationCandidates('sim_2');
    const cachedSecond = await listSimulationCandidates('sim_2');
    expect(cachedFirst).toHaveLength(1);
    expect(cachedSecond).toHaveLength(1);
    expect(mockedRecruiterGet).toHaveBeenCalledTimes(2);
  });

  it('clears candidate cache on error and retries', async () => {
    mockedRecruiterGet.mockRejectedValueOnce(new Error('fail'));
    await expect(listSimulationCandidates('sim_3')).rejects.toThrow('fail');
    mockedRecruiterGet.mockResolvedValueOnce([]);
    await listSimulationCandidates('sim_3');
    expect(mockedRecruiterGet).toHaveBeenCalledTimes(2);
  });

  it('calls compare endpoint and normalizes rows', async () => {
    mockedRecruiterGet.mockResolvedValueOnce([{ candidate_session_id: 12, candidate: { name: 'Alex', email: 'alex@example.com' }, status: 'completed', fit_profile_status: 'ready', overall_fit_score: 76, recommendation: 'lean_hire' }]);
    const rows = await listSimulationCandidateCompare('sim_22');
    expect(mockedRecruiterGet).toHaveBeenCalledWith('/simulations/sim_22/candidates/compare', expect.objectContaining({ cache: 'no-store' }));
    expect(rows).toEqual([expect.objectContaining({ candidateSessionId: '12', candidateLabel: 'Alex', fitProfileStatus: 'ready', overallFitScore: 0.76 })]);
  });

  it('returns empty compare list for blank simulation id', async () => {
    expect(await listSimulationCandidateCompare('   ')).toEqual([]);
    expect(mockedRecruiterGet).not.toHaveBeenCalled();
  });
});
