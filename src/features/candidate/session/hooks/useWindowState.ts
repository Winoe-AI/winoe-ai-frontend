import { useEffect, useMemo, useState } from 'react';
import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';
import { resolveNowMs } from '@/shared/time/now';
import {
  deriveWindowState,
  type TaskWindowClosedOverride,
} from '../lib/windowState';

type Params = {
  dayWindows: CandidateDayWindow[] | null | undefined;
  currentDayIndex: number | null | undefined;
  currentDayWindow: CandidateCurrentDayWindow | null | undefined;
  override: TaskWindowClosedOverride | null | undefined;
};

export function useWindowState({
  dayWindows,
  currentDayIndex,
  currentDayWindow,
  override,
}: Params) {
  const [nowMs, setNowMs] = useState(() => resolveNowMs());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(resolveNowMs());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(
    () =>
      deriveWindowState({
        dayWindows,
        currentDayIndex,
        currentDayWindow,
        override,
        nowMs,
      }),
    [currentDayIndex, currentDayWindow, dayWindows, nowMs, override],
  );
}
