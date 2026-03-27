import type { DispatchLoadArgs, WorkspaceStatusRefs, WorkspaceStatusSetters } from './workspaceStatus.types';

type DispatchWorkspaceLoadArgs = {
  enabled: boolean;
  load: (force?: boolean) => Promise<unknown> | void;
  refs: WorkspaceStatusRefs;
  setters: WorkspaceStatusSetters;
};

export function dispatchWorkspaceLoad(
  { enabled, load, refs, setters }: DispatchWorkspaceLoadArgs,
  {
    mode,
    trigger,
    resetPollCount = false,
    clearFallbackReason = false,
    preserveFallbackReasonOnFailure = false,
  }: DispatchLoadArgs,
) {
  if (!enabled) return;
  if (resetPollCount) refs.notReadyPollCountRef.current = 0;
  refs.modeRef.current = mode;
  refs.loadTriggerRef.current = trigger;
  if (clearFallbackReason) {
    refs.fallbackReasonBeforeRetryRef.current = preserveFallbackReasonOnFailure
      ? refs.codespaceFallbackReasonRef.current
      : null;
    setters.setCodespaceFallbackReason(null);
  } else {
    refs.fallbackReasonBeforeRetryRef.current = null;
  }
  if (mode === 'init') setters.setLoading(true);
  else setters.setRefreshing(true);
  void load(true);
}
