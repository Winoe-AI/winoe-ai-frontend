import { normalizeDayWindows } from '../utils/schedule';
import type { PickWindowArgs, WindowStatePhase } from './windowState.types';
import { toIsoOrNull } from './windowState.parse';

export function pickWindow(params: PickWindowArgs): {
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
  if (!first) return { dayIndex: index, windowStartAt: null, windowEndAt: null };
  return {
    dayIndex: first.dayIndex,
    windowStartAt: toIsoOrNull(first.windowStartAt),
    windowEndAt: toIsoOrNull(first.windowEndAt),
  };
}

export function baseDisabledReason(phase: WindowStatePhase): string | null {
  if (phase === 'closed_before_start') {
    return 'This day is not open yet. Workspace, tests, and submit stay disabled until the window starts.';
  }
  if (phase === 'closed_after_end') {
    return 'Day closed. This panel is read-only outside the scheduled window.';
  }
  return null;
}
