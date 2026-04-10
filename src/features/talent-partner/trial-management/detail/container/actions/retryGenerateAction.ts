import type { Dispatch, SetStateAction } from 'react';
import { retryTrialGeneration } from '@/features/talent-partner/api/trialLifecycleApi';
import { toUserMessage } from '@/platform/errors/errors';
import { buildActionError } from '../actionError';
import type { logTrialDetailEvent } from '../../utils/eventsUtils';

type RetryGenerateArgs = {
  retryGenerateLoading: boolean;
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setRetryGenerateLoading: Dispatch<SetStateAction<boolean>>;
  refreshPlan: () => Promise<void>;
  logEvent: typeof logTrialDetailEvent;
};

export async function retryGenerateAction({
  retryGenerateLoading,
  trialId,
  trialStatus,
  selectedScenarioVersionIndex,
  setActionError,
  setRetryGenerateLoading,
  refreshPlan,
  logEvent,
}: RetryGenerateArgs): Promise<void> {
  if (retryGenerateLoading) return;
  setActionError(null);
  setRetryGenerateLoading(true);
  logEvent('retry_generate_clicked', {
    trialId,
    status: trialStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await retryTrialGeneration(trialId);
    if (!result.ok) {
      setActionError(
        buildActionError(result.message, 'Unable to retry generation.'),
      );
      return;
    }
    await refreshPlan();
  } catch (caught: unknown) {
    setActionError(
      buildActionError(
        toUserMessage(caught, 'Unable to retry generation.', {
          includeDetail: false,
        }),
        'Unable to retry generation.',
      ),
    );
  } finally {
    setRetryGenerateLoading(false);
  }
}
