import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/api';
import {
  countdownFromUtc,
  formatCountdown,
  normalizeDayWindows,
} from '../utils/schedule';

export type WindowStatePhase =
  | 'open'
  | 'closed_before_start'
  | 'closed_after_end'
  | 'unknown';

export type TaskWindowClosedOverride = {
  errorCode: 'TASK_WINDOW_CLOSED';
  windowStartAt: string | null;
  windowEndAt: string | null;
  nextOpenAt: string | null;
  detail: string | null;
  receivedAtMs: number;
};

export type WindowActionGate = {
  isReadOnly: boolean;
  disabledReason: string | null;
  comeBackAt: string | null;
};

export type DerivedWindowState = {
  phase: WindowStatePhase;
  dayIndex: number | null;
  windowStartAt: string | null;
  windowEndAt: string | null;
  nextOpenAt: string | null;
  countdownTargetAt: string | null;
  countdownLabel: string | null;
  actionGate: WindowActionGate;
  correctedByBackend: boolean;
  backendDetail: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function readCode(record: Record<string, unknown> | null): string | null {
  if (!record) return null;
  const errorCode = record.errorCode;
  if (typeof errorCode === 'string' && errorCode.trim())
    return errorCode.trim();
  const code = record.code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  return null;
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const iso = value.trim();
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return iso;
}

function toTimestamp(iso: string | null): number | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return null;
  return ts;
}

function pickWindow(params: {
  dayWindows: CandidateDayWindow[] | null | undefined;
  currentDayIndex: number | null | undefined;
  currentDayWindow: CandidateCurrentDayWindow | null | undefined;
}): {
  dayIndex: number | null;
  windowStartAt: string | null;
  windowEndAt: string | null;
} {
  const windows = normalizeDayWindows(params.dayWindows);
  const index =
    typeof params.currentDayIndex === 'number' &&
    Number.isFinite(params.currentDayIndex)
      ? params.currentDayIndex
      : null;

  if (index !== null) {
    const byDay = windows.find((window) => window.dayIndex === index);
    if (byDay) {
      return {
        dayIndex: byDay.dayIndex,
        windowStartAt: toIsoOrNull(byDay.windowStartAt),
        windowEndAt: toIsoOrNull(byDay.windowEndAt),
      };
    }
  }

  if (params.currentDayWindow) {
    return {
      dayIndex: params.currentDayWindow.dayIndex,
      windowStartAt: toIsoOrNull(params.currentDayWindow.windowStartAt),
      windowEndAt: toIsoOrNull(params.currentDayWindow.windowEndAt),
    };
  }

  const first = windows[0] ?? null;
  if (!first) {
    return { dayIndex: index, windowStartAt: null, windowEndAt: null };
  }

  return {
    dayIndex: first.dayIndex,
    windowStartAt: toIsoOrNull(first.windowStartAt),
    windowEndAt: toIsoOrNull(first.windowEndAt),
  };
}

function baseDisabledReason(phase: WindowStatePhase): string | null {
  if (phase === 'closed_before_start') {
    return 'This day is not open yet. Workspace, tests, and submit stay disabled until the window starts.';
  }
  if (phase === 'closed_after_end') {
    return 'Day closed. This panel is read-only outside the scheduled window.';
  }
  return null;
}

export function deriveWindowState(params: {
  dayWindows: CandidateDayWindow[] | null | undefined;
  currentDayIndex: number | null | undefined;
  currentDayWindow: CandidateCurrentDayWindow | null | undefined;
  override: TaskWindowClosedOverride | null | undefined;
  nowMs?: number;
}): DerivedWindowState {
  const nowMs = params.nowMs ?? Date.now();
  const selected = pickWindow({
    dayWindows: params.dayWindows,
    currentDayIndex: params.currentDayIndex,
    currentDayWindow: params.currentDayWindow,
  });

  const baselineStart = selected.windowStartAt;
  const baselineEnd = selected.windowEndAt;

  const windowStartAt = params.override?.windowStartAt ?? baselineStart;
  const windowEndAt = params.override?.windowEndAt ?? baselineEnd;
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
  const countdown = countdownFromUtc(countdownTargetAt, nowMs);
  const countdownLabel = countdownTargetAt ? formatCountdown(countdown) : null;

  const baseReason = baseDisabledReason(phase);
  const actionGate: WindowActionGate = {
    isReadOnly: phase === 'closed_before_start' || phase === 'closed_after_end',
    disabledReason: baseReason,
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

export function extractTaskWindowClosedOverride(
  err: unknown,
): TaskWindowClosedOverride | null {
  const record = asRecord(err);
  const details = asRecord(record?.details);
  const raw = asRecord(record?.raw);
  const rawDetails = asRecord(raw?.details);

  const carrier = details ?? rawDetails ?? record;
  const nestedDetails = asRecord(carrier?.details);

  const code =
    readCode(carrier) ??
    readCode(record) ??
    readCode(rawDetails) ??
    readCode(nestedDetails);
  if (code !== 'TASK_WINDOW_CLOSED') return null;

  const payload = nestedDetails ?? carrier;
  let detailMessage: string | null = null;
  if (typeof carrier?.detail === 'string' && carrier.detail.trim()) {
    detailMessage = carrier.detail.trim();
  } else if (typeof carrier?.message === 'string' && carrier.message.trim()) {
    detailMessage = carrier.message.trim();
  } else if (typeof record?.message === 'string' && record.message.trim()) {
    detailMessage = record.message.trim();
  }

  return {
    errorCode: 'TASK_WINDOW_CLOSED',
    windowStartAt: toIsoOrNull(payload?.windowStartAt),
    windowEndAt: toIsoOrNull(payload?.windowEndAt),
    nextOpenAt: toIsoOrNull(payload?.nextOpenAt),
    detail: detailMessage,
    receivedAtMs: Date.now(),
  };
}

export function formatLocalTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatLocalDateTime(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatComeBackMessage(
  override: Pick<TaskWindowClosedOverride, 'nextOpenAt' | 'windowStartAt'>,
): string {
  const label = formatLocalDateTime(
    override.nextOpenAt ?? override.windowStartAt,
  );
  if (label) return `This day is currently closed. Come back at ${label}.`;
  return 'This day is currently closed outside the scheduled window.';
}
