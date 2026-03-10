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
  mode: 'init' | 'refresh' | 'poll';
  taskId: number;
  candidateSessionId: number;
  initAttempted: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
};

function getWorkspaceErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const rec = err as Record<string, unknown>;
  if (typeof rec.errorCode === 'string' && rec.errorCode.trim())
    return rec.errorCode.trim();
  const details = rec.details;
  if (!details || typeof details !== 'object') return null;
  const detailRecord = details as Record<string, unknown>;
  if (
    typeof detailRecord.errorCode === 'string' &&
    detailRecord.errorCode.trim()
  )
    return detailRecord.errorCode.trim();
  if (typeof detailRecord.code === 'string' && detailRecord.code.trim())
    return detailRecord.code.trim();
  return null;
}

async function fetchOrInitWorkspace(
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

function getWorkspaceCodespaceState(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const record = err as Record<string, unknown>;
  if (typeof record.codespaceState === 'string' && record.codespaceState.trim())
    return record.codespaceState.trim();
  const details = record.details;
  if (!details || typeof details !== 'object') return null;
  const detailRecord = details as Record<string, unknown>;
  if (
    typeof detailRecord.codespaceState === 'string' &&
    detailRecord.codespaceState.trim()
  )
    return detailRecord.codespaceState.trim();
  if (
    typeof detailRecord.codespace_status === 'string' &&
    detailRecord.codespace_status.trim()
  )
    return detailRecord.codespace_status.trim();
  return null;
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
    const errorCode = getWorkspaceErrorCode(err) ?? normalized.code;
    const codespaceState = getWorkspaceCodespaceState(err);
    const status = toStatus(err);
    const isSignin =
      status === 401 || status === 403 || normalized.action === 'signin';
    if (isSignin) return sessionExpired();
    if (errorCode === 'WORKSPACE_NOT_INITIALIZED') return provisioning();
    if (status === 409) return provisioning();
    return workspaceError(mode, normalized.message, {
      errorCode,
      codespaceState,
    });
  }
}
