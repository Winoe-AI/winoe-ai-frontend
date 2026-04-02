import type {
  CodespaceAvailability,
  CodespaceFallbackReason,
} from './codespaceAvailabilityUtils';

type CodespaceFallbackShownEvent = {
  dayIndex: number;
  taskId: number;
  availability: CodespaceAvailability | null;
  reason: CodespaceFallbackReason | null;
  hasWorkspaceIdentity: boolean;
};

export function logCodespaceFallbackShown(event: CodespaceFallbackShownEvent) {
  // eslint-disable-next-line no-console
  console.info('[candidate:codespace_fallback_shown]', event);
}
