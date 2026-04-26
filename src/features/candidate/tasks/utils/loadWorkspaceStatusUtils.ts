import { normalizeApiError, toStatus } from '@/platform/errors/errors';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import { buildWorkspaceMessage } from './workspaceMessagesUtils';
import { fetchOrInitWorkspace } from './loadWorkspaceStatus.fetchUtils';
import {
  getWorkspaceCodespaceState,
  getWorkspaceErrorCode,
} from './loadWorkspaceStatus.errorsUtils';
import {
  provisioning,
  refreshed,
  sessionExpired,
  success,
  workspaceError,
  type WorkspaceLoadResult,
} from './workspaceResponsesUtils';

type Params = {
  mode: 'init' | 'refresh' | 'poll';
  taskId: number;
  candidateSessionId: number;
  initAttempted: boolean;
  githubUsername: string | null | undefined;
  onTaskWindowClosed?: (err: unknown) => void;
};

export async function loadWorkspaceStatus({
  mode,
  taskId,
  candidateSessionId,
  initAttempted,
  githubUsername,
  onTaskWindowClosed,
}: Params): Promise<WorkspaceLoadResult> {
  try {
    const workspace = await fetchOrInitWorkspace(
      mode,
      initAttempted,
      taskId,
      candidateSessionId,
      githubUsername,
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
    const errorCode = getWorkspaceErrorCode(err) ?? normalized.code;
    const codespaceState = getWorkspaceCodespaceState(err);
    const status = toStatus(err);
    const isSignin =
      status === 401 || status === 403 || normalized.action === 'signin';
    if (isSignin) return sessionExpired();
    if (errorCode === 'WORKSPACE_NOT_INITIALIZED') return provisioning();
    if (status === 409 || status === 410) return provisioning();
    return workspaceError(mode, normalized.message, {
      errorCode,
      codespaceState,
    });
  }
}
