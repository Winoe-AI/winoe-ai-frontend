import { emitDebugEvent } from '@/shared/analytics/debugEvents';
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
  emitDebugEvent({
    message: '[candidate:codespace_fallback_shown]',
    payload: event,
  });
}
