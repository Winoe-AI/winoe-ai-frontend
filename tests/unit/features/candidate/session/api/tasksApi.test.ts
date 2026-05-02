jest.mock('@/platform/api-client/client/request', () => ({
  requestWithMeta: jest.fn(),
}));

import { requestWithMeta } from '@/platform/api-client/client/request';
import { getCandidateCurrentTask } from '@/features/candidate/session/api/tasksApi';

const requestWithMetaMock = requestWithMeta as jest.Mock;

describe('getCandidateCurrentTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes completed_at from the backend completed task response', async () => {
    requestWithMetaMock.mockResolvedValue({
      data: {
        isComplete: true,
        completed_at: '2025-01-15T10:00:00Z',
        progress: { completedTaskIds: [1, 2, 3, 4, 5] },
        currentTask: null,
      },
    });

    await expect(getCandidateCurrentTask(99)).resolves.toEqual({
      isComplete: true,
      completedAt: '2025-01-15T10:00:00Z',
      completedTaskIds: [1, 2, 3, 4, 5],
      progress: { completedTaskIds: [1, 2, 3, 4, 5] },
      currentTask: null,
    });
  });
});
