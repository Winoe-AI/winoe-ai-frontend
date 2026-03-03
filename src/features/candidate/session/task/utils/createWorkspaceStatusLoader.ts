import { loadWorkspaceStatus } from './loadWorkspaceStatus';
import type { WorkspaceLoadResult } from './workspaceResponses';

type LoaderRefs = {
  modeRef: { current: 'init' | 'refresh' };
  initAttemptedRef: { current: boolean };
};

type LoaderParams = LoaderRefs & {
  taskId: number;
  candidateSessionId: number;
};

export function createWorkspaceStatusLoader({
  taskId,
  candidateSessionId,
  modeRef,
  initAttemptedRef,
}: LoaderParams) {
  return (): Promise<WorkspaceLoadResult> => {
    return loadWorkspaceStatus({
      mode: modeRef.current,
      taskId,
      candidateSessionId,
      initAttempted: initAttemptedRef.current,
    });
  };
}
