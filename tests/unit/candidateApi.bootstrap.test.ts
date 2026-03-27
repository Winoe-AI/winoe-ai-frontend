import { jest } from '@jest/globals';
import {
  FetchMock,
  importCandidateApi,
  installFetchMock,
  jsonRes,
  restoreApiBase,
} from './candidateApi.testlib';

describe('candidateApi bootstrap and invites', () => {
  afterAll(() => {
    restoreApiBase();
  });

  it('resolves invite token with backend proxy request', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        candidateSessionId: 10,
        status: 'in_progress',
        simulation: { title: 'Backend Sim', role: 'Backend' },
      }),
    );
    installFetchMock(fetchMock);

    const { resolveCandidateInviteToken } = await importCandidateApi();
    const result = await resolveCandidateInviteToken('tok_123');

    expect(result.candidateSessionId).toBe(10);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/tok_123',
      expect.objectContaining({ method: 'GET', cache: 'no-store' }),
    );
  });

  it('lists candidate invites and normalizes response', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes([
        {
          candidate_session_id: 9,
          simulationTitle: 'Design Sim',
          role_name: 'Designer',
          progress: { completed: 1, total: 5 },
          token: 'abc',
          expires_at: '2025-01-01',
          is_expired: true,
        },
      ]),
    );
    installFetchMock(fetchMock);

    const { listCandidateInvites } = await importCandidateApi();
    const invites = await listCandidateInvites();
    expect(invites[0]).toMatchObject({
      candidateSessionId: 9,
      title: 'Design Sim',
      role: 'Designer',
      token: 'abc',
      progress: { completed: 1, total: 5 },
      isExpired: true,
    });
  });

  it('surfaces bootstrap errors as HttpError instances', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(jsonRes({ detail: 'Invalid' }, 404));
    installFetchMock(fetchMock);

    const { resolveCandidateInviteToken, HttpError } = await importCandidateApi();
    await expect(resolveCandidateInviteToken('bad')).rejects.toBeInstanceOf(HttpError);
  });
});
