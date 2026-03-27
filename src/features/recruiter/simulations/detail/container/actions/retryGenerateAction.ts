import type { Dispatch, SetStateAction } from 'react';
import { retrySimulationGeneration } from '@/features/recruiter/api/simulationLifecycle';
import { toUserMessage } from '@/lib/errors/errors';
import { buildActionError } from '../actionError';
import type { logSimulationDetailEvent } from '../../utils/events';

type RetryGenerateArgs = {
  retryGenerateLoading: boolean;
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setRetryGenerateLoading: Dispatch<SetStateAction<boolean>>;
  refreshPlan: () => Promise<void>;
  logEvent: typeof logSimulationDetailEvent;
};

export async function retryGenerateAction({
  retryGenerateLoading,
  simulationId,
  simulationStatus,
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
    simulationId,
    status: simulationStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await retrySimulationGeneration(simulationId);
    if (!result.ok) {
      setActionError(buildActionError(result.message, 'Unable to retry generation.'));
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
