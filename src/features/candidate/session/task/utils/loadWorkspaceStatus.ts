import {
  getCandidateWorkspaceStatus,
  initCandidateWorkspace,
  type CandidateWorkspaceStatus,
} from '@/features/candidate/api';
import { normalizeApiError, toStatus } from '@/lib/errors/errors';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../../lib/windowState';
import { buildWorkspaceMessage } from './workspaceMessages';
import {
  provisioning,
  refreshed,
  sessionExpired,
  success,
  workspaceError,
  type WorkspaceLoadResult,
} from './workspaceResponses';

type Params = {
  mode: 'init' | 'refresh';
  taskId: number;
  candidateSessionId: number;
  initAttempted: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
};

async function fetchOrInitWorkspace(
  mode: 'init' | 'refresh',
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

export async function loadWorkspaceStatus({
  mode,
  taskId,
  candidateSessionId,
  initAttempted,
  onTaskWindowClosed,
}: Params): Promise<WorkspaceLoadResult> {
  try {
    const workspace = await fetchOrInitWorkspace(
      mode,
      initAttempted,
      taskId,
      candidateSessionId,
    );
    if (mode === 'refresh' && workspace) {
      return refreshed(workspace, buildWorkspaceMessage(workspace));
    }
    return success(workspace);
  } catch (err) {
    const windowClosed = extractTaskWindowClosedOverride(err);
    if (windowClosed) {
      onTaskWindowClosed?.(err);
      return workspaceError(mode, formatComeBackMessage(windowClosed));
    }
    const normalized = normalizeApiError(
      err,
      'Unable to load your workspace right now.',
    );
    const status = toStatus(err);
    const isSignin =
      status === 401 || status === 403 || normalized.action === 'signin';
    if (isSignin) return sessionExpired();
    if (status === 409) return provisioning();
    return workspaceError(mode, normalized.message);
  }
}
