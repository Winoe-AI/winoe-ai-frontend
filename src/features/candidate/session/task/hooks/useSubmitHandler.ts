import { useEffect, useRef, useState } from 'react';
import { useBackoffPolling } from '@/shared/polling';
import { isSubmitResponse } from '../utils/taskGuards';
import type { SubmitPayload } from '../types';

type SubmitStatus = 'idle' | 'submitting' | 'submitted';

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useSubmitHandler(
  onSubmit: (payload: SubmitPayload) => Promise<unknown> | unknown,
) {
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [lastProgress, setLastProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [lastShaRefs, setLastShaRefs] = useState<{
    checkpointSha: string | null;
    finalSha: string | null;
    commitSha: string | null;
  } | null>(null);
  const [lastError, setLastError] = useState<unknown>(null);

  const resetTimer = useBackoffPolling<void>({
    initialDelayMs: 900,
    getDelayMs: () => 900,
    run: () => {
      setSubmitStatus('idle');
      setLastProgress(null);
      setLastShaRefs(null);
      setLastError(null);
      return false;
    },
  });
  const inFlightRef = useRef(false);
  const lastErrorRef = useRef<unknown>(null);

  useEffect(() => {
    return () => resetTimer.cancel();
  }, [resetTimer]);

  const handleSubmit = async (payload: SubmitPayload) => {
    if (submitStatus !== 'idle' || inFlightRef.current)
      return { status: 'busy' };

    inFlightRef.current = true;
    setSubmitStatus('submitting');
    setLastError(null);
    lastErrorRef.current = null;
    try {
      const resp = await onSubmit(payload);
      if (isSubmitResponse(resp)) {
        setLastProgress(resp.progress);
        setLastShaRefs({
          checkpointSha: toNullableString(resp.checkpointSha),
          finalSha: toNullableString(resp.finalSha),
          commitSha: toNullableString(resp.commitSha),
        });
        setSubmitStatus('submitted');
        resetTimer.start(undefined);
      } else {
        setSubmitStatus('idle');
      }
      return resp;
    } catch (err) {
      setLastError(err);
      lastErrorRef.current = err;
      setSubmitStatus('idle');
      return 'submit-failed';
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    submitStatus,
    lastProgress,
    lastShaRefs,
    lastError,
    getLastError: () => lastErrorRef.current,
    handleSubmit,
  };
}
