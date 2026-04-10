import {
  createTrial,
  mockTalentPartnerRequest,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi createTrial success/validation', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('returns validation failure when required fields are missing', async () => {
    const result = await createTrial({
      title: '',
      role: ' ',
      techStack: '',
      seniority: 'mid',
      templateKey: 'python-fastapi',
    });
    expect(result).toEqual({
      id: '',
      ok: false,
      status: 400,
      message: 'Missing required fields',
    });
    expect(mockTalentPartnerRequest).not.toHaveBeenCalled();
  });

  it('posts trimmed payload and normalizes id', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { id: 'sim_99' },
      requestId: null,
    });
    const result = await createTrial({
      title: '  Backend Sim ',
      role: ' Backend ',
      techStack: ' Node ',
      seniority: 'senior',
      templateKey: 'node-express-ts',
      focus: '  Focus ',
      companyContext: { domain: ' fintech ', productArea: ' payments ' },
      ai: {
        noticeVersion: ' mvp1 ',
        evalEnabledByDay: {
          '1': true,
          '2': true,
          '3': false,
          '4': true,
          '5': true,
        },
      },
    });
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials',
      expect.objectContaining({
        method: 'POST',
        body: {
          title: 'Backend Sim',
          role: 'Backend',
          techStack: 'Node',
          seniority: 'senior',
          templateKey: 'node-express-ts',
          focus: 'Focus',
          companyContext: { domain: 'fintech', productArea: 'payments' },
          ai: {
            noticeVersion: 'mvp1',
            evalEnabledByDay: {
              '1': true,
              '2': true,
              '3': false,
              '4': true,
              '5': true,
            },
          },
        },
      }),
    );
    expect(result).toEqual({
      id: 'sim_99',
      ok: true,
      status: 201,
      message: undefined,
    });
  });

  it('normalizes snake_case ids and omits blank optional fields', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { trial_id: 42 },
      requestId: null,
    });
    expect(
      await createTrial({
        title: 'Sim',
        role: 'Backend',
        techStack: 'Node',
        seniority: 'junior',
        templateKey: 'python-fastapi',
      }),
    ).toEqual({ id: '42', ok: true, status: 201, message: undefined });

    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { id: 'sim_200' },
      requestId: null,
    });
    const result = await createTrial({
      title: 'Sim',
      role: 'Backend',
      techStack: 'Node',
      seniority: 'junior',
      templateKey: 'python-fastapi',
      focus: '   ',
      companyContext: { domain: '   ', productArea: '' },
    });
    expect(result).toEqual({
      id: 'sim_200',
      ok: true,
      status: 201,
      message: undefined,
    });
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials',
      expect.objectContaining({
        method: 'POST',
        body: {
          title: 'Sim',
          role: 'Backend',
          techStack: 'Node',
          seniority: 'junior',
          templateKey: 'python-fastapi',
        },
      }),
    );
  });

  it('posts to BFF base even when public API base is absolute', async () => {
    process.env.NEXT_PUBLIC_WINOE_API_BASE_URL =
      'https://backend.example.com/api';
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { id: 'sim_env' },
      requestId: null,
    });
    const result = await createTrial({
      title: 'Env Sim',
      role: 'Backend',
      techStack: 'Node',
      seniority: 'junior',
      templateKey: 'python-fastapi',
    });
    expect(result.id).toBe('sim_env');
  });
});
