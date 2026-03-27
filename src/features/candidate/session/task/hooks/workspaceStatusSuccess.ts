import type { ToastInput } from '@/shared/notifications/types';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  classifyCodespaceAvailability,
} from '../utils/codespaceAvailability';
import type { WorkspaceLoadResult } from '../utils/workspaceResponses';
import {
  isFallbackRetryTrigger,
  type WorkspaceStatusRefs,
  type WorkspaceStatusSetters,
} from './workspaceStatus.types';

type NotifyFn = (payload: ToastInput) => void;

type HandleWorkspaceStatusSuccessArgs = {
  enableCodespaceFallback: boolean;
  taskId: number;
  notify: NotifyFn;
  refs: WorkspaceStatusRefs;
  setters: WorkspaceStatusSetters;
};

export function handleWorkspaceStatusSuccess(
  { enableCodespaceFallback, taskId, notify, refs, setters }: HandleWorkspaceStatusSuccessArgs,
  result: WorkspaceLoadResult,
) {
  const mode = refs.modeRef.current;
  const trigger = refs.loadTriggerRef.current;
  const fallbackReasonBeforeRetry = refs.fallbackReasonBeforeRetryRef.current;
  refs.fallbackReasonBeforeRetryRef.current = null;
  if (result.workspace) {
    setters.setWorkspace(result.workspace);
    refs.initAttemptedRef.current = true;
  }
  setters.setNotice(result.notice);
  setters.setError(result.error);
  const availability = classifyCodespaceAvailability(result);
  setters.setCodespaceAvailability(availability);

  if (availability === 'ready') {
    refs.notReadyPollCountRef.current = 0;
    setters.setCodespaceFallbackReason(null);
    refs.fallbackRetryModeRef.current = 'refresh';
  } else if (availability === 'not_ready') {
    const nextPollCount = refs.notReadyPollCountRef.current + 1;
    refs.notReadyPollCountRef.current = nextPollCount;
    if (enableCodespaceFallback && nextPollCount >= CODESPACE_NOT_READY_MAX_POLLS) {
      setters.setCodespaceFallbackReason('not_ready_timeout');
      refs.fallbackRetryModeRef.current = 'refresh';
    }
  } else if (availability === 'unavailable') {
    if (enableCodespaceFallback) {
      setters.setCodespaceFallbackReason('unavailable');
      refs.fallbackRetryModeRef.current = mode === 'init' ? 'init' : 'refresh';
    }
  } else if (enableCodespaceFallback && mode === 'init') {
    setters.setCodespaceFallbackReason('init_error');
    refs.fallbackRetryModeRef.current = 'init';
  } else if (
    enableCodespaceFallback &&
    isFallbackRetryTrigger(trigger) &&
    fallbackReasonBeforeRetry
  ) {
    setters.setCodespaceFallbackReason(fallbackReasonBeforeRetry);
    refs.fallbackRetryModeRef.current =
      trigger === 'fallback_retry_init' ? 'init' : 'refresh';
  }

  if (result.notify) {
    const id =
      result.notify.tone === 'success'
        ? `workspace-${taskId}-refresh`
        : `workspace-${taskId}-error`;
    notify({ id, ...result.notify });
  }
  if (mode === 'init') setters.setLoading(false);
  else setters.setRefreshing(false);
}
