import {
  importCandidateApi,
  mockGet,
  resetCandidateApiMocks,
} from './candidate.testlib';

describe('candidate api invite helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('lists invites and normalizes shape', async () => {
    mockGet.mockResolvedValueOnce([
      {
        candidate_session_id: 5,
        token: 'tok',
        title: 'Sim',
        role: 'Eng',
        company: 'Co',
        status: 'not_started',
        progress: { completed: 5, total: 10 },
        expiresAt: '2024-01-01',
      },
    ]);
    const invites = await (await importCandidateApi()).listCandidateInvites();
    expect(mockGet).toHaveBeenCalledWith(
      '/candidate/invites?includeTerminated=true',
      expect.objectContaining({
        cache: 'no-store',
        cacheTtlMs: 60_000,
        dedupeKey: 'candidate-invites',
      }),
      expect.objectContaining({
        basePath: '/api/backend',
        skipAuth: false,
      }),
    );
    expect(invites[0]).toMatchObject({
      candidateSessionId: 5,
      token: 'tok',
      title: 'Sim',
      role: 'Eng',
      progress: { completed: 5, total: 5 },
    });
  });

  it('returns [] for non-array responses and maps unknown objects', async () => {
    mockGet.mockResolvedValueOnce({ not: 'array' });
    const api = await importCandidateApi();
    expect(await api.listCandidateInvites()).toEqual([]);
    expect(
      api.normalizeCandidateInvite({
        id: 'NaN',
        inviteToken: '',
        status: 'expired',
        progress: { completed: 'one', total: 'two' },
      }),
    ).toMatchObject({
      candidateSessionId: 0,
      token: null,
      isExpired: true,
      progress: null,
    });
  });

  it('maps resolveCandidateInviteToken auth and access statuses', async () => {
    const { resolveCandidateInviteToken } = await importCandidateApi();
    mockGet.mockRejectedValueOnce({ status: 400 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('invalid'),
    });
    mockGet.mockRejectedValueOnce({ status: 404 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('invalid'),
    });
    mockGet.mockRejectedValueOnce({ status: 410 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 410,
      message: expect.stringContaining('expired'),
    });
    mockGet.mockRejectedValueOnce({
      status: 409,
      details: {
        candidateSessionId: 77,
        status: 'in_progress',
        trial: { title: 'Existing trial', role: 'Role' },
      },
    });
    await expect(resolveCandidateInviteToken('tok')).resolves.toMatchObject({
      candidateSessionId: 77,
      status: 'in_progress',
      trial: { title: 'Existing trial', role: 'Role' },
    });
    mockGet.mockRejectedValueOnce({ status: 401 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 401,
      message: 'Please sign in again.',
    });
    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'email claim missing' },
    });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'We could not confirm your sign-in. Please sign in again.',
    });
    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'email claim missing' },
    });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'We could not confirm your sign-in. Please sign in again.',
    });
    mockGet.mockRejectedValueOnce({
      status: 403,
      details: { message: 'other' },
    });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 403,
      message: 'You do not have access to this invite.',
    });
  });

  it('propagates list and resolve backend errors through HttpError', async () => {
    const api = await importCandidateApi();
    mockGet.mockRejectedValueOnce(new Error('fetch'));
    await expect(api.listCandidateInvites()).rejects.toBeInstanceOf(
      api.HttpError,
    );
    mockGet.mockRejectedValueOnce({ status: 500, details: 'backend' });
    await expect(api.resolveCandidateInviteToken('tok')).rejects.toMatchObject({
      status: 500,
    });
    mockGet.mockRejectedValueOnce('wtf');
    await expect(api.resolveCandidateInviteToken('tok')).rejects.toBeInstanceOf(
      api.HttpError,
    );
  });
});
