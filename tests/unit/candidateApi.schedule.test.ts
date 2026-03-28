import { jest } from '@jest/globals';
import {
  FetchMock,
  importCandidateApi,
  installFetchMock,
  jsonRes,
  restoreApiBase,
} from './candidateApi.testlib';

describe('candidateApi schedule', () => {
  afterAll(() => {
    restoreApiBase();
  });

  it('submits candidate schedule through backend proxy', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        candidateSessionId: 10,
        scheduledStartAt: '2026-03-10T13:00:00Z',
        candidateTimezone: 'America/New_York',
        dayWindows: [
          {
            dayIndex: 1,
            windowStartAt: '2026-03-10T13:00:00Z',
            windowEndAt: '2026-03-10T21:00:00Z',
          },
        ],
        scheduleLockedAt: '2026-03-01T00:00:00Z',
      }),
    );
    installFetchMock(fetchMock);
    const { scheduleCandidateSession } = await importCandidateApi();
    const result = await scheduleCandidateSession('tok_123', {
      scheduledStartAt: '2026-03-10T13:00:00Z',
      candidateTimezone: 'America/New_York',
    });
    expect(result.candidateSessionId).toBe(10);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/tok_123/schedule',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('maps timezone validation errors with status 422', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes(
        {
          detail: 'Timezone is invalid.',
          errorCode: 'SCHEDULE_INVALID_TIMEZONE',
        },
        422,
      ),
    );
    installFetchMock(fetchMock);
    const { scheduleCandidateSession } = await importCandidateApi();
    await expect(
      scheduleCandidateSession('tok_123', {
        scheduledStartAt: '2026-03-10T13:00:00Z',
        candidateTimezone: 'America/New_York',
      }),
    ).rejects.toMatchObject({ status: 422, message: 'Timezone is invalid.' });
  });
});
