import { createSimulation, mockRecruiterRequest, resetRecruiterApiMocks, restoreRecruiterApiEnv } from './recruiterApi.testlib';

describe('recruiterApi createSimulation error normalization', () => {
  beforeEach(() => {
    resetRecruiterApiMocks();
  });

  afterEach(() => {
    restoreRecruiterApiEnv();
  });

  it('returns structured error when request throws', async () => {
    mockRecruiterRequest.mockRejectedValueOnce({ message: 'Missing title', status: 400 });
    const result = await createSimulation({ title: 'Sim Name', role: 'Backend', techStack: 'Node', seniority: 'junior', templateKey: 'python-fastapi' });
    expect(result).toMatchObject({ ok: false, status: 400, message: 'Missing title', id: '' });
  });

  it('normalizes explicit error payload responses', async () => {
    mockRecruiterRequest.mockResolvedValueOnce({ data: { status: 409, detail: 'Conflict', simulation_id: null }, requestId: null });
    const result = await createSimulation({ title: 'Sim', role: 'Backend', techStack: 'Node', seniority: 'junior', templateKey: 'python-fastapi' });
    expect(result).toEqual({ id: '', ok: false, status: 409, message: 'Conflict' });
  });
});
