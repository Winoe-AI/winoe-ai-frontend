import type { CandidateWorkspaceStatus } from './types';
import { requestWorkspaceStatus } from './workspace.request';

export async function initCandidateWorkspace(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<CandidateWorkspaceStatus> {
  const { taskId, candidateSessionId } = params;
  return requestWorkspaceStatus({
    path: `/tasks/${taskId}/codespace/init`,
    candidateSessionId,
    method: 'POST',
    body: {},
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
