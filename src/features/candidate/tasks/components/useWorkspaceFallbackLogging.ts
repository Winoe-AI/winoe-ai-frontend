import { useEffect, useRef } from 'react';
import type {
  CodespaceAvailability,
  CodespaceFallbackReason,
} from '../utils/codespaceAvailabilityUtils';
import { logCodespaceFallbackShown } from '../utils/workspaceEventsUtils';

type UseWorkspaceFallbackLoggingArgs = {
  shouldShowFallback: boolean;
  dayIndex: number;
  taskId: number;
  codespaceAvailability: CodespaceAvailability | null;
  codespaceFallbackReason: CodespaceFallbackReason | null;
  hasWorkspaceIdentity: boolean;
};

export function useWorkspaceFallbackLogging({
  shouldShowFallback,
  dayIndex,
  taskId,
  codespaceAvailability,
  codespaceFallbackReason,
  hasWorkspaceIdentity,
}: UseWorkspaceFallbackLoggingArgs) {
  const fallbackLoggedRef = useRef(false);

  useEffect(() => {
    if (!shouldShowFallback) {
      fallbackLoggedRef.current = false;
      return;
    }
    if (fallbackLoggedRef.current) return;
    fallbackLoggedRef.current = true;
    logCodespaceFallbackShown({
      dayIndex,
      taskId,
      availability: codespaceAvailability,
      reason: codespaceFallbackReason,
      hasWorkspaceIdentity,
    });
  }, [
    codespaceAvailability,
    codespaceFallbackReason,
    dayIndex,
    hasWorkspaceIdentity,
    shouldShowFallback,
    taskId,
  ]);
}
