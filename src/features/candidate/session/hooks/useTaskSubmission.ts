import { useEffect, useRef, useState } from 'react';
import { useTaskSubmitHandler } from './useTaskSubmitHandler';
import type { Task } from '../task/types';

type Params = {
  candidateSessionId: number | null;
  currentTask: Task | null;
  clearTaskError: () => void;
  setTaskError: (msg: string) => void;
  refreshTask: (opts?: { skipCache?: boolean }) => Promise<void>;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmissionRecorded?: (payload: {
    submissionId: number;
    submittedAt: string;
  }) => void;
};

export function useTaskSubmission({
  candidateSessionId,
  currentTask,
  clearTaskError,
  setTaskError,
  refreshTask,
  onTaskWindowClosed = () => {},
  onSubmissionRecorded = () => {},
}: Params) {
  const [submitting, setSubmitting] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const { handleSubmit } = useTaskSubmitHandler({
    candidateSessionId,
    currentTask,
    clearTaskError,
    setTaskError,
    refreshTask,
    setSubmitting,
    onTaskWindowClosed,
    onSubmissionRecorded,
    setRefreshTimer: (cb) => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(cb, 900);
    },
  });

  return { submitting, handleSubmit };
}
