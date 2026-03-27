import type { Dispatch, SetStateAction } from 'react';
import { approveScenarioVersion } from '@/features/recruiter/api/simulationLifecycle';
import { toUserMessage } from '@/lib/errors/errors';
import { buildActionError } from '../actionError';
import type { logSimulationDetailEvent } from '../../utils/events';

type ApproveScenarioArgs = {
  canApprove: boolean;
  approveLoading: boolean;
  selectedScenarioVersionId: string | undefined;
  selectedScenarioVersionIndex: number | null;
  simulationId: string;
  simulationStatus: string | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setApproveLoading: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  setPendingRegeneration: Dispatch<
    SetStateAction<{ jobId: string; scenarioVersionId: string; pollAfterMs: number | null; attempt: number } | null>
  >;
  refreshPlan: () => Promise<void>;
  logEvent: typeof logSimulationDetailEvent;
};

export async function approveScenarioAction({
  canApprove,
  approveLoading,
  selectedScenarioVersionId,
  selectedScenarioVersionIndex,
  simulationId,
  simulationStatus,
  setActionError,
  setApproveLoading,
  setStatusOverride,
  setPendingRegeneration,
  refreshPlan,
  logEvent,
}: ApproveScenarioArgs): Promise<void> {
  if (!canApprove || approveLoading || !selectedScenarioVersionId) return;
  setActionError(null);
  setApproveLoading(true);
  logEvent('approve_clicked', {
    simulationId,
    status: simulationStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await approveScenarioVersion(
      simulationId,
      selectedScenarioVersionId,
    );
    if (!result.ok) {
      setActionError(
        buildActionError(result.message, 'Unable to approve this scenario version.'),
      );
      return;
    }
    if (typeof result.data?.status === 'string' && result.data.status.trim()) {
      setStatusOverride(result.data.status);
    }
    setPendingRegeneration(null);
    await refreshPlan();
  } catch (caught: unknown) {
    setActionError(
      buildActionError(
        toUserMessage(caught, 'Unable to approve this scenario version.', {
          includeDetail: false,
        }),
        'Unable to approve this scenario version.',
      ),
    );
  } finally {
    setApproveLoading(false);
  }
}
