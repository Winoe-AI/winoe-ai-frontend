import { jest } from '@jest/globals';
import { responseHelpers } from '../setup';

const jsonRes = (
  body: unknown,
  status?: number,
  headers?: Record<string, string>,
) => responseHelpers.jsonResponse(body, status, headers) as unknown as Response;
type FetchMock = jest.MockedFunction<typeof fetch>;

const originalApiBase = process.env.NEXT_PUBLIC_TENON_API_BASE_URL;

async function importApi() {
  jest.resetModules();
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = 'http://api.example.com';
  return import('@/features/candidate/api');
}

describe('candidateApi', () => {
  afterAll(() => {
    process.env.NEXT_PUBLIC_TENON_API_BASE_URL = originalApiBase;
  });

  it('resolves invite token with bearer auth', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        candidateSessionId: 10,
        status: 'in_progress',
        simulation: { title: 'Backend Sim', role: 'Backend' },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { resolveCandidateInviteToken } = await importApi();
    const result = await resolveCandidateInviteToken('tok_123');

    expect(result.candidateSessionId).toBe(10);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/tok_123',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
      }),
    );
  });

  it('lists candidate invites with bearer auth', async () => {
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
    global.fetch = fetchMock as unknown as typeof fetch;

    const { listCandidateInvites } = await importApi();
    const invites = await listCandidateInvites();

    expect(invites[0]).toMatchObject({
      candidateSessionId: 9,
      title: 'Design Sim',
      role: 'Designer',
      token: 'abc',
      progress: { completed: 1, total: 5 },
      isExpired: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/invites',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('surfaces bootstrap errors with status codes', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(jsonRes({ detail: 'Invalid' }, 404));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { resolveCandidateInviteToken, HttpError } = await importApi();

    await expect(resolveCandidateInviteToken('bad')).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it('fetches current task with bearer and session headers', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        isComplete: false,
        completedTaskIds: [],
        currentTask: {
          id: 2,
          dayIndex: 1,
          type: 'design',
          title: 'Plan',
          description: 'Draw it',
        },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getCandidateCurrentTask } = await importApi();

    const result = await getCandidateCurrentTask(44);
    expect(result.currentTask?.id).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/44/current_task',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-candidate-session-id': '44',
        }),
      }),
    );
  });

  it('hydrates current task recorded submission metadata when present', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        isComplete: false,
        completedTaskIds: [],
        currentTask: {
          id: 2,
          dayIndex: 1,
          type: 'design',
          title: 'Plan',
          description: 'Draw it',
          recordedSubmission: {
            submissionId: 77,
            submittedAt: '2026-03-04T20:00:00Z',
          },
        },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getCandidateCurrentTask } = await importApi();
    const result = await getCandidateCurrentTask(44);

    expect(result.currentTask?.recordedSubmission).toEqual({
      submissionId: 77,
      submittedAt: '2026-03-04T20:00:00Z',
    });
  });

  it('maps current task network failures to status 0', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockRejectedValue(new TypeError('offline'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getCandidateCurrentTask } = await importApi();

    await expect(getCandidateCurrentTask(10)).rejects.toMatchObject({
      status: 0,
    });
  });

  it('submits candidate task payload with session id header', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockResolvedValue(
      jsonRes({
        submissionId: 3,
        taskId: 7,
        candidateSessionId: 1,
        submittedAt: '2025-01-01T00:00:00Z',
        progress: { completed: 1, total: 5 },
        isComplete: false,
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { submitCandidateTask } = await importApi();

    await submitCandidateTask({
      taskId: 7,
      candidateSessionId: 1,
      contentText: 'Answer',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/tasks/7/submit',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-candidate-session-id': '1',
        }),
      }),
    );
  });

  it('surfaces submit errors for network TypeError', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock.mockRejectedValue(new TypeError('offline'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { submitCandidateTask } = await importApi();

    await expect(
      submitCandidateTask({
        taskId: 5,
        candidateSessionId: 9,
        contentText: 'Ok',
      }),
    ).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Network error'),
    });
  });

  it('maps submit 400/404/409/410 statuses to friendly messages', async () => {
    const fetchMock = jest.fn() as FetchMock;
    fetchMock
      .mockResolvedValueOnce(jsonRes({ details: 'oops' }, 400))
      .mockResolvedValueOnce(jsonRes({ details: 'missing' }, 404))
      .mockResolvedValueOnce(jsonRes({ details: 'dup' }, 409))
      .mockResolvedValueOnce(jsonRes({ details: 'expired' }, 410));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { submitCandidateTask, HttpError } = await importApi();

    const commonParams = {
      taskId: 5,
      candidateSessionId: 9,
      contentText: 'Ok',
    };

    await expect(submitCandidateTask(commonParams)).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(submitCandidateTask(commonParams)).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(submitCandidateTask(commonParams)).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(submitCandidateTask(commonParams)).rejects.toBeInstanceOf(
      HttpError,
    );
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
    global.fetch = fetchMock as unknown as typeof fetch;

    const { scheduleCandidateSession } = await importApi();
    const result = await scheduleCandidateSession('tok_123', {
      scheduledStartAt: '2026-03-10T13:00:00Z',
      candidateTimezone: 'America/New_York',
    });

    expect(result.candidateSessionId).toBe(10);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/candidate/session/tok_123/schedule',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('maps schedule timezone validation errors with status 422', async () => {
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
    global.fetch = fetchMock as unknown as typeof fetch;

    const { scheduleCandidateSession } = await importApi();

    await expect(
      scheduleCandidateSession('tok_123', {
        scheduledStartAt: '2026-03-10T13:00:00Z',
        candidateTimezone: 'America/New_York',
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: 'Timezone is invalid.',
    });
  });
});
