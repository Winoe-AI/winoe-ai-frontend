import {
  createTrial,
  mockTalentPartnerRequest,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi createTrial error normalization', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('returns structured error when request throws', async () => {
    mockTalentPartnerRequest.mockRejectedValueOnce({
      message: 'Missing title',
      status: 400,
    });
    const result = await createTrial({
      title: 'Sim Name',
      role: 'Backend',
      techStack: 'Node',
      seniority: 'junior',
      templateKey: 'python-fastapi',
    });
    expect(result).toMatchObject({
      ok: false,
      status: 400,
      message: 'Missing title',
      id: '',
    });
  });

  it('normalizes explicit error payload responses', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { status: 409, detail: 'Conflict', trial_id: null },
      requestId: null,
    });
    const result = await createTrial({
      title: 'Sim',
      role: 'Backend',
      techStack: 'Node',
      seniority: 'junior',
      templateKey: 'python-fastapi',
    });
    expect(result).toEqual({
      id: '',
      ok: false,
      status: 409,
      message: 'Conflict',
    });
  });
});
