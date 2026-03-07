import { useCallback } from 'react';
import {
  pollCandidateTestRun,
  startCandidateTestRun,
} from '@/features/candidate/api';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { PollResult } from '../task/hooks/runTestsTypes';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../lib/windowState';

type Params = {
  candidateSessionId: number | null;
  currentTask: CandidateTask | null;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function useTestHandlers({
  candidateSessionId,
  currentTask,
  onTaskWindowClosed = () => {},
}: Params) {
  const handleStartTests = useCallback(async () => {
    if (!candidateSessionId || !currentTask) {
      throw new Error('Missing session context.');
    }
    try {
      return await startCandidateTestRun({
        taskId: currentTask.id,
        candidateSessionId,
      });
    } catch (err) {
      const windowClosed = extractTaskWindowClosedOverride(err);
      if (windowClosed) {
        onTaskWindowClosed(err);
        throw new Error(formatComeBackMessage(windowClosed));
      }
      throw err;
    }
  }, [candidateSessionId, currentTask, onTaskWindowClosed]);

  const handlePollTests = useCallback(
    async (runId: string): Promise<PollResult> => {
      if (!candidateSessionId || !currentTask) {
        throw new Error('Missing session context.');
      }
      try {
        return await pollCandidateTestRun({
          taskId: currentTask.id,
          runId,
          candidateSessionId,
        });
      } catch (err) {
        const windowClosed = extractTaskWindowClosedOverride(err);
        if (windowClosed) {
          onTaskWindowClosed(err);
          throw new Error(formatComeBackMessage(windowClosed));
        }
        throw err;
      }
    },
    [candidateSessionId, currentTask, onTaskWindowClosed],
  );

  return { handleStartTests, handlePollTests };
}
