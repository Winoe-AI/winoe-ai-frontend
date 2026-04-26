import type { CandidateWorkspaceStatus } from './typesApi';
import { requestWorkspaceStatus } from './workspace.requestApi';

export async function initCandidateWorkspace(params: {
  taskId: number;
  candidateSessionId: number;
  githubUsername: string;
}): Promise<CandidateWorkspaceStatus> {
  const { taskId, candidateSessionId, githubUsername } = params;
  return requestWorkspaceStatus({
    path: `/tasks/${taskId}/codespace/init`,
    candidateSessionId,
    method: 'POST',
    body: { githubUsername },
  });
}

export async function getCandidateWorkspaceStatus(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<CandidateWorkspaceStatus> {
  const { taskId, candidateSessionId } = params;
  return requestWorkspaceStatus({
    path: `/tasks/${taskId}/codespace/status`,
    candidateSessionId,
  });
}
