import type { Dispatch, SetStateAction } from 'react';
import { activateTrialInviting } from '@/features/talent-partner/api/trialLifecycleApi';
import { toUserMessage } from '@/platform/errors/errors';
import type { ToastInput } from '@/shared/notifications/types';
import { buildActionError } from '../actionError';
import type { logTrialDetailEvent } from '../../utils/eventsUtils';

type NotifyFn = (payload: ToastInput) => void;

type ActivateTrialArgs = {
  activateLoading: boolean;
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setActivateLoading: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  refreshPlan: () => Promise<void>;
  notify: NotifyFn;
  logEvent: typeof logTrialDetailEvent;
};

export async function activateTrialAction({
  activateLoading,
  trialId,
  trialStatus,
  selectedScenarioVersionIndex,
  setActionError,
  setActivateLoading,
  setStatusOverride,
  refreshPlan,
  notify,
  logEvent,
}: ActivateTrialArgs): Promise<void> {
  if (activateLoading) return;
  setActionError(null);
  setActivateLoading(true);
  logEvent('activate_clicked', {
    trialId,
    status: trialStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await activateTrialInviting(trialId);
    if (!result.ok) {
      const message = buildActionError(
        result.message,
        'Unable to activate this trial.',
      );
      setActionError(message);
      notify({
        id: `activate-error-${trialId}`,
        tone: 'error',
        title: 'Failed to activate trial',
        description: message,
      });
      logEvent('activate_failure', {
        trialId,
        status: trialStatus,
        scenarioVersion: selectedScenarioVersionIndex,
      });
      return;
    }

    setStatusOverride('active_inviting');
    notify({
      id: `activate-success-${trialId}`,
      tone: 'success',
      title: 'Trial activated',
      description: 'Candidate invites are now enabled.',
    });
    logEvent('activate_success', {
      trialId,
      status: 'active_inviting',
      scenarioVersion: selectedScenarioVersionIndex,
    });
    await refreshPlan();
  } catch (caught: unknown) {
    const message = buildActionError(
      toUserMessage(caught, 'Unable to activate this trial.', {
        includeDetail: false,
      }),
      'Unable to activate this trial.',
    );
    setActionError(message);
    notify({
      id: `activate-error-${trialId}`,
      tone: 'error',
      title: 'Failed to activate trial',
      description: message,
    });
    logEvent('activate_failure', {
      trialId,
      status: trialStatus,
      scenarioVersion: selectedScenarioVersionIndex,
    });
  } finally {
    setActivateLoading(false);
  }
}
