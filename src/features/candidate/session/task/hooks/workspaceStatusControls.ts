import { useCallback, useEffect } from 'react';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  CODESPACE_NOT_READY_POLL_INTERVAL_MS,
  type CodespaceAvailability,
  type CodespaceFallbackReason,
} from '../utils/codespaceAvailability';
import { dispatchWorkspaceLoad } from './workspaceStatusDispatch';
import type {
  DispatchLoadArgs,
  WorkspaceStatusRefs,
  WorkspaceStatusSetters,
} from './workspaceStatus.types';

type UseWorkspaceStatusControlsArgs = {
  enabled: boolean;
  enableCodespaceFallback: boolean;
  loading: boolean;
  refreshing: boolean;
  codespaceAvailability: CodespaceAvailability | null;
  codespaceFallbackReason: CodespaceFallbackReason | null;
  abort: () => void;
  load: (force?: boolean) => Promise<unknown> | void;
  refs: WorkspaceStatusRefs;
  setters: WorkspaceStatusSetters;
};

export function useWorkspaceStatusControls({
  enabled,
  enableCodespaceFallback,
  loading,
  refreshing,
  codespaceAvailability,
  codespaceFallbackReason,
  abort,
  load,
  refs,
  setters,
}: UseWorkspaceStatusControlsArgs) {
  const dispatchLoad = useCallback((args: DispatchLoadArgs) => {
    dispatchWorkspaceLoad({ enabled, load, refs, setters }, args);
  }, [enabled, load, refs, setters]);

  useEffect(() => {
    if (!enabled) {
      abort();
      refs.notReadyPollCountRef.current = 0;
      refs.fallbackRetryModeRef.current = 'refresh';
      return;
    }
    refs.notReadyPollCountRef.current = 0;
    const id = window.setTimeout(
      () => dispatchLoad({ mode: 'init', trigger: 'initial', clearFallbackReason: true }),
      0,
    );
    return () => {
      window.clearTimeout(id);
      abort();
    };
  }, [abort, dispatchLoad, enabled, refs]);

  useEffect(() => {
    if (!enabled || !enableCodespaceFallback) return;
    if (loading || refreshing) return;
    if (codespaceFallbackReason || codespaceAvailability !== 'not_ready') return;
    if (refs.notReadyPollCountRef.current >= CODESPACE_NOT_READY_MAX_POLLS) return;
    const id = window.setTimeout(() => dispatchLoad({ mode: 'poll', trigger: 'poll' }), CODESPACE_NOT_READY_POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [
    codespaceAvailability,
    codespaceFallbackReason,
    dispatchLoad,
    enableCodespaceFallback,
    enabled,
    loading,
    refreshing,
    refs,
  ]);

  const refresh = useCallback(() => {
    if (!enabled || loading || refreshing) return;
    dispatchLoad({
      mode: 'refresh',
      trigger: 'manual_refresh',
      resetPollCount: true,
      clearFallbackReason: true,
    });
  }, [dispatchLoad, enabled, loading, refreshing]);

  const retryCodespace = useCallback(() => {
    if (!enabled || loading || refreshing) return;
    const shouldRetryInit = refs.fallbackRetryModeRef.current === 'init';
    dispatchLoad({ mode: shouldRetryInit ? 'init' : 'refresh', trigger: shouldRetryInit ? 'fallback_retry_init' : 'fallback_retry_status', resetPollCount: true, clearFallbackReason: true, preserveFallbackReasonOnFailure: true });
  }, [dispatchLoad, enabled, loading, refreshing, refs]);

  return { refresh, retryCodespace };
}
