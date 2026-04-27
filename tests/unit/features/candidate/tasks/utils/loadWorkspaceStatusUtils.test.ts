import { HttpError } from '@/platform/api-client/errors/errors';
import { loadWorkspaceStatus } from '@/features/candidate/tasks/utils/loadWorkspaceStatusUtils';
import { fetchOrInitWorkspace } from '@/features/candidate/tasks/utils/loadWorkspaceStatus.fetchUtils';

jest.mock(
  '@/features/candidate/tasks/utils/loadWorkspaceStatus.fetchUtils',
  () => ({
    fetchOrInitWorkspace: jest.fn(),
  }),
);

const fetchOrInitWorkspaceMock = fetchOrInitWorkspace as jest.MockedFunction<
  typeof fetchOrInitWorkspace
>;

describe('loadWorkspaceStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps 410 Gone workspace status to provisioning', async () => {
    fetchOrInitWorkspaceMock.mockRejectedValueOnce(new HttpError(410, 'Gone'));

    await expect(
      loadWorkspaceStatus({
        mode: 'init',
        taskId: 7,
        candidateSessionId: 2,
        initAttempted: false,
        githubUsername: 'candidate-one',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        notice: 'Codespace is not provisioned yet. Please try again shortly.',
        error: null,
        errorCode: 'WORKSPACE_NOT_INITIALIZED',
        codespaceState: 'not_ready',
      }),
    );
  });
});
