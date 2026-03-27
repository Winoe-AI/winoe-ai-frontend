import { importCandidateApi, mockGet, resetCandidateApiMocks } from './candidate.testlib';

describe('candidate api invite helpers', () => {
  beforeEach(() => {
    resetCandidateApiMocks();
  });

  it('lists invites and normalizes shape', async () => {
    mockGet.mockResolvedValueOnce([{ candidate_session_id: 5, token: 'tok', title: 'Sim', role: 'Eng', company: 'Co', status: 'not_started', progress: { completed: 0, total: 3 }, expiresAt: '2024-01-01' }]);
    const invites = await (await importCandidateApi()).listCandidateInvites();
    expect(mockGet).toHaveBeenCalled();
    expect(invites[0]).toMatchObject({ candidateSessionId: 5, token: 'tok', title: 'Sim', role: 'Eng' });
  });

  it('returns [] for non-array responses and maps unknown objects', async () => {
    mockGet.mockResolvedValueOnce({ not: 'array' });
    const api = await importCandidateApi();
    expect(await api.listCandidateInvites()).toEqual([]);
    expect(api.normalizeCandidateInvite({ id: 'NaN', inviteToken: '', status: 'expired', progress: { completed: 'one', total: 'two' } })).toMatchObject({
      candidateSessionId: 0,
      token: null,
      isExpired: true,
      progress: null,
    });
  });

  it('maps resolveCandidateInviteToken auth and access statuses', async () => {
    const { resolveCandidateInviteToken } = await importCandidateApi();
    mockGet.mockRejectedValueOnce({ status: 404 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 404 });
    mockGet.mockRejectedValueOnce({ status: 410 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 410 });
    mockGet.mockRejectedValueOnce({ status: 401 });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 401, message: 'Please sign in again.' });
    mockGet.mockRejectedValueOnce({ status: 403, details: { message: 'Email verification required' } });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 403, message: 'Please verify your email, then try again.' });
    mockGet.mockRejectedValueOnce({ status: 403, details: { message: 'email claim missing' } });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 403, message: 'We could not confirm your email. Please sign in again.' });
    mockGet.mockRejectedValueOnce({ status: 403, details: { message: 'other' } });
    await expect(resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 403, message: 'You do not have access to this invite.' });
  });

  it('propagates list and resolve backend errors through HttpError', async () => {
    const api = await importCandidateApi();
    mockGet.mockRejectedValueOnce(new Error('fetch'));
    await expect(api.listCandidateInvites()).rejects.toBeInstanceOf(api.HttpError);
    mockGet.mockRejectedValueOnce({ status: 500, details: 'backend' });
    await expect(api.resolveCandidateInviteToken('tok')).rejects.toMatchObject({ status: 500 });
    mockGet.mockRejectedValueOnce('wtf');
    await expect(api.resolveCandidateInviteToken('tok')).rejects.toBeInstanceOf(api.HttpError);
  });
});
