import type { Dispatch, SetStateAction } from 'react';
import { terminateTrial } from '@/features/talent-partner/api/trialLifecycleApi';
import { toUserMessage } from '@/platform/errors/errors';
import type { ToastInput } from '@/shared/notifications/types';
import { buildActionError } from '../actionError';
import type { logTrialDetailEvent } from '../../utils/eventsUtils';

type NotifyFn = (payload: ToastInput) => void;

type TerminateTrialArgs = {
  terminatePending: boolean;
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setTerminatePending: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  setCleanupJobIds: Dispatch<SetStateAction<string[]>>;
  setTerminateModalOpen: Dispatch<SetStateAction<boolean>>;
  setTerminateBlockedStatus: Dispatch<SetStateAction<403 | 404 | null>>;
  closeInviteModal: () => void;
  notify: NotifyFn;
  logEvent: typeof logTrialDetailEvent;
};

function logFailure(args: {
  logEvent: TerminateTrialArgs['logEvent'];
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
}) {
  args.logEvent('terminate_failure', {
    trialId: args.trialId,
    status: args.trialStatus,
    scenarioVersion: args.selectedScenarioVersionIndex,
  });
}

export async function terminateTrialAction({
  terminatePending,
  trialId,
  trialStatus,
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
}: TerminateTrialArgs): Promise<void> {
  if (terminatePending) return;
  setActionError(null);
  setTerminatePending(true);
  logEvent('terminate_confirmed', {
    trialId,
    status: trialStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await terminateTrial(trialId);
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
        id: `terminate-success-${trialId}`,
        tone: 'success',
        title: 'Trial terminated',
        description: returnedCleanup.length
          ? 'Cleanup started in the background.'
          : 'Invites are now disabled for this trial.',
      });
      logEvent('terminate_success', {
        trialId,
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
        trialId,
        trialStatus,
        selectedScenarioVersionIndex,
      });
      return;
    }
    const message = buildActionError(
      result.message,
      'Unable to terminate this trial.',
    );
    setActionError(message);
    notify({
      id: `terminate-error-${trialId}`,
      tone: 'error',
      title: 'Failed to terminate trial',
      description: message,
    });
    logFailure({
      logEvent,
      trialId,
      trialStatus,
      selectedScenarioVersionIndex,
    });
  } catch (caught: unknown) {
    const message = buildActionError(
      toUserMessage(caught, 'Unable to terminate this trial.', {
        includeDetail: false,
      }),
      'Unable to terminate this trial.',
    );
    setActionError(message);
    notify({
      id: `terminate-error-${trialId}`,
      tone: 'error',
      title: 'Failed to terminate trial',
      description: message,
    });
    logFailure({
      logEvent,
      trialId,
      trialStatus,
      selectedScenarioVersionIndex,
    });
  } finally {
    setTerminatePending(false);
  }
}
