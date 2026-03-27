import { countdownFromUtc, formatCountdown } from '../utils/scheduleUtils';
import type {
  DerivedWindowState,
  TaskWindowClosedOverride,
  WindowActionGate,
  WindowStatePhase,
} from './windowState.types';
import { toTimestamp } from './windowState.parse';
import { baseDisabledReason, pickWindow } from './windowState.select';

export function deriveWindowState(params: {
  dayWindows:
    | import('@/features/candidate/session/api').CandidateDayWindow[]
    | null
    | undefined;
  currentDayIndex: number | null | undefined;
  currentDayWindow:
    | import('@/features/candidate/session/api').CandidateCurrentDayWindow
    | null
    | undefined;
  override: TaskWindowClosedOverride | null | undefined;
  nowMs?: number;
}): DerivedWindowState {
  const nowMs = params.nowMs ?? Date.now();
  const selected = pickWindow({
    dayWindows: params.dayWindows,
    currentDayIndex: params.currentDayIndex,
    currentDayWindow: params.currentDayWindow,
  });
  const windowStartAt =
    params.override?.windowStartAt ?? selected.windowStartAt;
  const windowEndAt = params.override?.windowEndAt ?? selected.windowEndAt;
  const nextOpenAt = params.override?.nextOpenAt ?? null;
  const windowStartMs = toTimestamp(windowStartAt);
  const windowEndMs = toTimestamp(windowEndAt);
  const nextOpenMs = toTimestamp(nextOpenAt);

  let phase: WindowStatePhase = 'unknown';
  if (windowStartMs !== null && nowMs < windowStartMs)
    phase = 'closed_before_start';
  else if (windowEndMs !== null && nowMs >= windowEndMs)
    phase = 'closed_after_end';
  else if (windowStartMs !== null || windowEndMs !== null) phase = 'open';
  else if (nextOpenMs !== null && nowMs < nextOpenMs)
    phase = 'closed_before_start';

  const countdownTargetAt =
    phase === 'closed_before_start'
      ? (nextOpenAt ?? windowStartAt ?? null)
      : null;
  const countdownLabel = countdownTargetAt
    ? formatCountdown(countdownFromUtc(countdownTargetAt, nowMs))
    : null;
  const actionGate: WindowActionGate = {
    isReadOnly: phase === 'closed_before_start' || phase === 'closed_after_end',
    disabledReason: baseDisabledReason(phase),
    comeBackAt:
      phase === 'closed_before_start' ? (nextOpenAt ?? windowStartAt) : null,
  };

  return {
    phase,
    dayIndex: selected.dayIndex,
    windowStartAt,
    windowEndAt,
    nextOpenAt,
    countdownTargetAt,
    countdownLabel,
    actionGate,
    correctedByBackend: Boolean(params.override),
    backendDetail: params.override?.detail ?? null,
  };
}
