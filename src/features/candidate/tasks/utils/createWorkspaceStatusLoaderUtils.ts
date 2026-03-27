import { loadWorkspaceStatus } from './loadWorkspaceStatusUtils';
import type { WorkspaceLoadResult } from './workspaceResponsesUtils';

type LoaderRefs = {
  modeRef: { current: 'init' | 'refresh' | 'poll' };
  initAttemptedRef: { current: boolean };
};

type LoaderParams = LoaderRefs & {
  taskId: number;
  candidateSessionId: number;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function createWorkspaceStatusLoader({
  taskId,
  candidateSessionId,
  modeRef,
  initAttemptedRef,
  onTaskWindowClosed,
}: LoaderParams) {
  return (): Promise<WorkspaceLoadResult> => {
    return loadWorkspaceStatus({
      mode: modeRef.current,
      taskId,
      candidateSessionId,
      initAttempted: initAttemptedRef.current,
      onTaskWindowClosed,
    });
  };
}
