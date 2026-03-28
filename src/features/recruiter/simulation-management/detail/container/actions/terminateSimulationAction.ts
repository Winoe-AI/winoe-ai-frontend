import type { Dispatch, SetStateAction } from 'react';
import { terminateSimulation } from '@/features/recruiter/api/simulationLifecycleApi';
import { toUserMessage } from '@/platform/errors/errors';
import type { ToastInput } from '@/shared/notifications/types';
import { buildActionError } from '../actionError';
import type { logSimulationDetailEvent } from '../../utils/eventsUtils';

type NotifyFn = (payload: ToastInput) => void;

type TerminateSimulationArgs = {
  terminatePending: boolean;
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setTerminatePending: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  setCleanupJobIds: Dispatch<SetStateAction<string[]>>;
  setTerminateModalOpen: Dispatch<SetStateAction<boolean>>;
  setTerminateBlockedStatus: Dispatch<SetStateAction<403 | 404 | null>>;
  closeInviteModal: () => void;
  notify: NotifyFn;
  logEvent: typeof logSimulationDetailEvent;
};

function logFailure(args: {
  logEvent: TerminateSimulationArgs['logEvent'];
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioVersionIndex: number | null;
}) {
  args.logEvent('terminate_failure', {
    simulationId: args.simulationId,
    status: args.simulationStatus,
    scenarioVersion: args.selectedScenarioVersionIndex,
  });
}

export async function terminateSimulationAction({
  terminatePending,
  simulationId,
  simulationStatus,
  selectedScenarioVersionIndex,
  setActionError,
  setTerminatePending,
  setStatusOverride,
  setCleanupJobIds,
  setTerminateModalOpen,
  setTerminateBlockedStatus,
  closeInviteModal,
  notify,
  logEvent,
}: TerminateSimulationArgs): Promise<void> {
  if (terminatePending) return;
  setActionError(null);
  setTerminatePending(true);
  logEvent('terminate_confirmed', {
    simulationId,
    status: simulationStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await terminateSimulation(simulationId);
    if (result.ok) {
      const returnedCleanup = Array.isArray(result.data?.cleanupJobIds)
        ? result.data.cleanupJobIds.filter(
            (id): id is string =>
              typeof id === 'string' && id.trim().length > 0,
          )
        : [];
      setStatusOverride('terminated');
      setCleanupJobIds(returnedCleanup);
      closeInviteModal();
      setTerminateModalOpen(false);
      notify({
        id: `terminate-success-${simulationId}`,
        tone: 'success',
        title: 'Simulation terminated',
        description: returnedCleanup.length
          ? 'Cleanup started in the background.'
          : 'Invites are now disabled for this simulation.',
      });
      logEvent('terminate_success', {
        simulationId,
        status: 'terminated',
        scenarioVersion: selectedScenarioVersionIndex,
      });
      return;
    }
    if (result.statusCode === 403 || result.statusCode === 404) {
      setTerminateModalOpen(false);
      setTerminateBlockedStatus(result.statusCode);
      logFailure({
        logEvent,
        simulationId,
        simulationStatus,
        selectedScenarioVersionIndex,
      });
      return;
    }
    const message = buildActionError(
      result.message,
      'Unable to terminate this simulation.',
    );
    setActionError(message);
    notify({
      id: `terminate-error-${simulationId}`,
      tone: 'error',
      title: 'Failed to terminate simulation',
      description: message,
    });
    logFailure({
      logEvent,
      simulationId,
      simulationStatus,
      selectedScenarioVersionIndex,
    });
  } catch (caught: unknown) {
    const message = buildActionError(
      toUserMessage(caught, 'Unable to terminate this simulation.', {
        includeDetail: false,
      }),
      'Unable to terminate this simulation.',
    );
    setActionError(message);
    notify({
      id: `terminate-error-${simulationId}`,
      tone: 'error',
      title: 'Failed to terminate simulation',
      description: message,
    });
    logFailure({
      logEvent,
      simulationId,
      simulationStatus,
      selectedScenarioVersionIndex,
    });
  } finally {
    setTerminatePending(false);
  }
}
