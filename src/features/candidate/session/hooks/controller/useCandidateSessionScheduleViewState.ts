import { useEffect, useMemo, useRef, useState } from 'react';
import {
  countdownFromUtc,
  firstWindowStartAt,
  formatCountdown,
  normalizeDayWindows,
} from '../../utils/scheduleUtils';
import type { CandidateSessionScheduleParams } from './useCandidateSessionSchedule.types';

type Params = Pick<
  CandidateSessionScheduleParams,
  'bootstrap' | 'view' | 'runInit' | 'token'
> & {
  scheduleTimezoneValue: string;
};

export function useCandidateSessionScheduleViewState({
  bootstrap,
  view,
  runInit,
  token,
  scheduleTimezoneValue,
}: Params) {
  const [clockNowMs, setClockNowMs] = useState<number>(() => Date.now());
  const unlockRefreshRef = useRef<string | null>(null);

  const scheduleResponseWindows = useMemo(
    () => normalizeDayWindows(bootstrap?.dayWindows),
    [bootstrap?.dayWindows],
  );
  const scheduleCurrentDayWindow = bootstrap?.currentDayWindow ?? null;
  const scheduleCountdownTargetAt = firstWindowStartAt({
    scheduledStartAt: bootstrap?.scheduledStartAt,
    dayWindows: bootstrap?.dayWindows,
    currentDayWindow: scheduleCurrentDayWindow,
  });
  const scheduleCountdown = useMemo(
    () => countdownFromUtc(scheduleCountdownTargetAt, clockNowMs),
    [clockNowMs, scheduleCountdownTargetAt],
  );
  const scheduleCountdownLabel = useMemo(
    () => formatCountdown(scheduleCountdown),
    [scheduleCountdown],
  );

  const fallbackTimezone = scheduleTimezoneValue.trim();
  const scheduleDisplayTimezone =
    bootstrap?.candidateTimezone ??
    (fallbackTimezone ? fallbackTimezone : null);
  const scheduleDisplayStartAt = bootstrap?.scheduledStartAt ?? null;

  useEffect(() => {
    if (view !== 'locked') return;
    const timer = window.setInterval(() => setClockNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'locked') {
      unlockRefreshRef.current = null;
      return;
    }
    if (!scheduleCountdown.complete) return;
    const key = scheduleCountdownTargetAt ?? 'immediate';
    if (unlockRefreshRef.current === key) return;
    unlockRefreshRef.current = key;
    void runInit(token, true);
  }, [
    runInit,
    scheduleCountdown.complete,
    scheduleCountdownTargetAt,
    token,
    view,
  ]);

  return {
    clockNowMs,
    scheduleResponseWindows,
    scheduleCurrentDayWindow,
    scheduleCountdownTargetAt,
    scheduleCountdownLabel,
    scheduleDisplayTimezone,
    scheduleDisplayStartAt,
  };
}
