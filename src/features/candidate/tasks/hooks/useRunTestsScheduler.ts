import { useCallback, useEffect, useRef } from 'react';
import { useBackoffPolling } from '@/shared/polling';
import {
  useRunTestsCleanup,
  useRunTestsVisibility,
} from './useRunTestsLifecycle';
import { limitMessages, statusMap } from './useRunTestsMessages';
import type { PollResult, RunState, RunTestsArgs } from './useRunTestsTypes';

type SchedulerConfig = Pick<
  RunTestsArgs,
  | 'onPoll'
  | 'pollIntervalMs'
  | 'maxPollIntervalMs'
  | 'maxAttempts'
  | 'maxDurationMs'
> & {
  finish: (state: RunState, message?: string) => void;
  setResult: (result: PollResult | null) => void;
  setState: (state: RunState) => void;
  locked: React.MutableRefObject<boolean>;
  pending: React.MutableRefObject<{ attempt: number; runId: string } | null>;
  startedAt: React.MutableRefObject<number | null>;
};

export function useRunTestsScheduler(config: SchedulerConfig) {
  const {
    onPoll,
    finish,
    setResult,
    setState,
    locked: lockedRef,
    pending: pendingRef,
    startedAt: startedAtRef,
  } = config;
  const pollInterval = config.pollIntervalMs ?? 1500;
  const pollAfterMsRef = useRef<number | null>(null);

  const poller = useBackoffPolling<string>({
    initialDelayMs: pollInterval,
    baseDelayMs: pollInterval,
    maxDelayMs: config.maxPollIntervalMs ?? pollInterval,
    maxAttempts: config.maxAttempts,
    maxDurationMs: config.maxDurationMs,
    getDelayMs: (attempt) => {
      if (
        typeof pollAfterMsRef.current === 'number' &&
        pollAfterMsRef.current > 0
      ) {
        return pollAfterMsRef.current;
      }
      const base = Math.max(1, pollInterval);
      const cap = Math.max(config.maxPollIntervalMs ?? pollInterval, base);
      return Math.min(Math.round(base * 1.4 ** attempt), cap);
    },
    run: async (runId) => {
      try {
        const res = await onPoll(runId);
        setResult(res);
        if (res.status === 'running') {
          pollAfterMsRef.current =
            typeof res.pollAfterMs === 'number' && res.pollAfterMs > 0
              ? res.pollAfterMs
              : null;
          setState('running');
          return true;
        }
        pollAfterMsRef.current = null;
        const mapped = statusMap[res.status];
        if (mapped) {
          finish(mapped, res.message);
        } else {
          finish('error', res.message);
        }
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to poll tests right now.';
        finish('error', message);
      }
      return false;
    },
    onTimeout: () => finish('error', limitMessages.duration),
    onMaxAttempts: () => finish('error', limitMessages.attempts),
    onError: (err) => {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to poll tests right now.';
      finish('error', message);
    },
  });

  const startPolling = useCallback(
    (runId: string, attemptStart = 0) => {
      startedAtRef.current = Date.now();
      lockedRef.current = true;
      pollAfterMsRef.current = null;
      if (attemptStart > 0) poller.startFrom(attemptStart, runId);
      else poller.start(runId);
    },
    [lockedRef, poller, startedAtRef],
  );

  useRunTestsVisibility(pendingRef, (attempt, runId) =>
    startPolling(runId, attempt),
  );
  useRunTestsCleanup(poller.cancel, pendingRef, lockedRef, startedAtRef);

  useEffect(() => poller.cancel, [poller.cancel]);
  return { startPolling, clearTimer: poller.cancel };
}
