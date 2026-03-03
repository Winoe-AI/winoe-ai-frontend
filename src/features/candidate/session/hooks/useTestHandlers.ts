import { useCallback } from 'react';
import {
  pollCandidateTestRun,
  startCandidateTestRun,
} from '@/features/candidate/api';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { PollResult } from '../task/hooks/runTestsTypes';

type Params = {
  candidateSessionId: number | null;
  currentTask: CandidateTask | null;
};

export function useTestHandlers({ candidateSessionId, currentTask }: Params) {
  const handleStartTests = useCallback(async () => {
    if (!candidateSessionId || !currentTask) {
      throw new Error('Missing session context.');
    }
    return startCandidateTestRun({
      taskId: currentTask.id,
      candidateSessionId,
    });
  }, [candidateSessionId, currentTask]);

  const handlePollTests = useCallback(
    async (runId: string): Promise<PollResult> => {
      if (!candidateSessionId || !currentTask) {
        throw new Error('Missing session context.');
      }
      return pollCandidateTestRun({
        taskId: currentTask.id,
        runId,
        candidateSessionId,
      });
    },
    [candidateSessionId, currentTask],
  );

  return { handleStartTests, handlePollTests };
}
