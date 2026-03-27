import {
  isFallbackRetryTrigger,
  type WorkspaceStatusRefs,
  type WorkspaceStatusSetters,
} from './useWorkspaceStatus.types';

type HandleWorkspaceStatusErrorArgs = {
  enableCodespaceFallback: boolean;
  refs: WorkspaceStatusRefs;
  setters: WorkspaceStatusSetters;
};

export function handleWorkspaceStatusError(
  { enableCodespaceFallback, refs, setters }: HandleWorkspaceStatusErrorArgs,
  err: unknown,
): string {
  const trigger = refs.loadTriggerRef.current;
  const fallbackReasonBeforeRetry = refs.fallbackReasonBeforeRetryRef.current;
  refs.fallbackReasonBeforeRetryRef.current = null;
  const message =
    err instanceof Error && err.message
      ? err.message
      : 'Unable to load your workspace right now.';
  setters.setError(message);
  setters.setLoading(false);
  setters.setRefreshing(false);
  setters.setCodespaceAvailability('error');
  if (
    enableCodespaceFallback &&
    isFallbackRetryTrigger(trigger) &&
    fallbackReasonBeforeRetry
  ) {
    setters.setCodespaceFallbackReason(fallbackReasonBeforeRetry);
    refs.fallbackRetryModeRef.current =
      trigger === 'fallback_retry_init' ? 'init' : 'refresh';
  } else if (enableCodespaceFallback && refs.modeRef.current === 'init') {
    setters.setCodespaceFallbackReason('init_error');
    refs.fallbackRetryModeRef.current = 'init';
  }
  return message;
}
