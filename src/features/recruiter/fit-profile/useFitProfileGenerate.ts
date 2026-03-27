import { useCallback, useState } from 'react';
import { toStatus } from '@/platform/errors/errors';
import { generateCandidateFitProfile } from './fitProfile.api';
import { generatingState } from './fitProfile.state';
import { stateFromGenerateError } from './fitProfile.stateResolve';
import type { FitProfileState } from './fitProfile.types';

type UseFitProfileGenerateArgs = {
  candidateSessionId: string;
  refreshStatusNow: () => Promise<void>;
};

export function useFitProfileGenerate({
  candidateSessionId,
  refreshStatusNow,
}: UseFitProfileGenerateArgs) {
  const [generatePending, setGeneratePending] = useState(false);
  const [stateOverride, setStateOverride] = useState<FitProfileState | null>(
    null,
  );

  const generate = useCallback(async () => {
    if (!candidateSessionId || generatePending) return;
    setGeneratePending(true);
    setStateOverride(generatingState());
    try {
      await generateCandidateFitProfile(candidateSessionId);
      await refreshStatusNow();
      setStateOverride(null);
    } catch (error) {
      setStateOverride(stateFromGenerateError(error));
      if (toStatus(error) === 409) {
        await refreshStatusNow();
        setStateOverride(null);
      }
    } finally {
      setGeneratePending(false);
    }
  }, [candidateSessionId, generatePending, refreshStatusNow]);

  const reload = useCallback(async () => {
    setStateOverride(null);
    await refreshStatusNow();
  }, [refreshStatusNow]);

  return { generatePending, stateOverride, generate, reload };
}
