import {
  getCandidateWorkspaceStatus,
  initCandidateWorkspace,
  type CandidateWorkspaceStatus,
} from '@/features/candidate/session/api';
import { toStatus } from '@/platform/errors/errors';

export async function fetchOrInitWorkspace(
  mode: 'init' | 'refresh' | 'poll',
  initAttempted: boolean,
  taskId: number,
  candidateSessionId: number,
): Promise<CandidateWorkspaceStatus | null> {
  try {
    const status = await getCandidateWorkspaceStatus({
      taskId,
      candidateSessionId,
    });
    const needsInit =
      !status?.repoUrl && !status?.repoName && !status?.codespaceUrl;
    if (mode === 'init' && needsInit && !initAttempted) {
      return await initCandidateWorkspace({
        taskId,
        candidateSessionId,
      });
    }
    return status;
  } catch (err) {
    if (mode === 'init' && toStatus(err) === 404 && !initAttempted) {
      return initCandidateWorkspace({ taskId, candidateSessionId });
    }
    throw err;
  }
}
