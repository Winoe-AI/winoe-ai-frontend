import {
  getCandidateWorkspaceStatus,
  initCandidateWorkspace,
  type CandidateWorkspaceStatus,
} from '@/features/candidate/session/api';
import {
  isValidGithubUsername,
  normalizeGithubUsername,
} from '@/features/candidate/session/utils/githubUsername';
import { toStatus } from '@/platform/errors/errors';

const WORKSPACE_NOT_INITIALIZED_STATUS = 410;

export async function fetchOrInitWorkspace(
  mode: 'init' | 'refresh' | 'poll',
  initAttempted: boolean,
  taskId: number,
  candidateSessionId: number,
  githubUsername: string | null | undefined,
): Promise<CandidateWorkspaceStatus | null> {
  const normalizedGithubUsername = normalizeGithubUsername(githubUsername);
  const githubUsernameValue = normalizedGithubUsername ?? '';
  try {
    const status = await getCandidateWorkspaceStatus({
      taskId,
      candidateSessionId,
    });
    const needsInit = !status?.codespaceUrl;
    if (mode === 'init' && needsInit && !initAttempted) {
      if (!isValidGithubUsername(githubUsernameValue)) {
        throw new Error(
          'GitHub username is required before Day 2 can initialize. Return to scheduling and save a valid username.',
        );
      }
      return await initCandidateWorkspace({
        taskId,
        candidateSessionId,
        githubUsername: githubUsernameValue,
      });
    }
    return status;
  } catch (err) {
    const status = toStatus(err);
    if (
      mode === 'init' &&
      (status === 404 || status === WORKSPACE_NOT_INITIALIZED_STATUS) &&
      !initAttempted
    ) {
      if (!isValidGithubUsername(githubUsernameValue)) {
        throw new Error(
          'GitHub username is required before Day 2 can initialize. Return to scheduling and save a valid username.',
        );
      }
      return initCandidateWorkspace({
        taskId,
        candidateSessionId,
        githubUsername: githubUsernameValue,
      });
    }
    throw err;
  }
}
