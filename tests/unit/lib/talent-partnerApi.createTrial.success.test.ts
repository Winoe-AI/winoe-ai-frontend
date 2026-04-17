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
      seniority: 'mid',
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
      data: { id: 'trial_99' },
      requestId: null,
    });
    const result = await createTrial({
      title: '  Backend Trial ',
      role: ' Backend ',
      seniority: 'senior',
      preferredLanguageFramework: ' Node ',
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
          title: 'Backend Trial',
          role: 'Backend',
          seniority: 'senior',
          preferredLanguageFramework: 'Node',
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
      id: 'trial_99',
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
        title: 'Trial',
        role: 'Backend',
        seniority: 'junior',
        preferredLanguageFramework: 'Node',
      }),
    ).toEqual({ id: '42', ok: true, status: 201, message: undefined });

    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { id: 'trial_200' },
      requestId: null,
    });
    const result = await createTrial({
      title: 'Trial',
      role: 'Backend',
      seniority: 'junior',
      preferredLanguageFramework: 'Node',
      focus: '   ',
      companyContext: { domain: '   ', productArea: '' },
    });
    expect(result).toEqual({
      id: 'trial_200',
      ok: true,
      status: 201,
      message: undefined,
    });
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials',
      expect.objectContaining({
        method: 'POST',
        body: {
          title: 'Trial',
          role: 'Backend',
          seniority: 'junior',
          preferredLanguageFramework: 'Node',
        },
      }),
    );
  });

  it('posts to BFF base even when public API base is absolute', async () => {
    process.env.NEXT_PUBLIC_WINOE_API_BASE_URL =
      'https://backend.example.com/api';
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { id: 'trial_env' },
      requestId: null,
    });
    const result = await createTrial({
      title: 'Env Trial',
      role: 'Backend',
      seniority: 'junior',
      preferredLanguageFramework: 'Node',
    });
    expect(result.id).toBe('trial_env');
  });
});
