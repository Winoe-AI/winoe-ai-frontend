'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/shared/notifications';
import { useRunTestsMachine } from './useRunTestsMachine';
import { loadStoredRunId } from './useRunTestsStorage';
import { fallbackMessage, toastCopy } from './useRunTestsCopy';
import { runTestsDisplayMeta } from './useRunTestsMeta';
import type { PollResult, RunState, RunTestsArgs } from './useRunTestsTypes';

export function useRunTests(args: RunTestsArgs) {
  const [state, setState] = useState<RunState>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<PollResult | null>(null);
  const { notify } = useNotifications();

  const onEnd = useCallback(
    (next: RunState, msg?: string) => {
      setState(next);
      setMessage(fallbackMessage(next, msg));
      if (next === 'idle' || next === 'starting' || next === 'running') return;
      const copy = toastCopy(next, msg);
      notify({
        id: 'run-tests',
        tone: copy.tone,
        title: copy.title,
        description: copy.description,
      });
    },
    [notify],
  );

  const { startRun, resumeStored } = useRunTestsMachine(args, {
    setState,
    setResult,
    onEnd,
  });

  useEffect(() => {
    if (!args.storageKey || state !== 'idle') return;
    const stored = loadStoredRunId(args.storageKey);
    if (stored) resumeStored(stored);
  }, [args.storageKey, resumeStored, state]);

  const meta = useMemo(
    () => runTestsDisplayMeta(state, result),
    [result, state],
  );

  const displayMessage =
    state === 'starting' || state === 'running'
      ? fallbackMessage(state)
      : message || fallbackMessage(state);

  return {
    state,
    message: displayMessage,
    result,
    ...meta,
    startRun,
  };
}
