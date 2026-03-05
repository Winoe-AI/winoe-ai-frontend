'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  activateSimulationInviting,
  regenerateSimulationScenario,
  retrySimulationGeneration,
  terminateSimulation,
} from '@/features/recruiter/api';
import { toUserMessage } from '@/lib/errors/errors';
import { useNotifications } from '@/shared/notifications';
import { SimulationDetailView } from './components/SimulationDetailView';
import { SimulationDetailBlockedState } from './components/SimulationDetailBlockedState';
import { useSimulationPlan } from './hooks/useSimulationPlan';
import { useSimulationCandidates } from './hooks/useSimulationCandidates';
import { useCandidatesSearch } from './hooks/useCandidatesSearch';
import { useCandidateRowActions } from './hooks/useCandidateRowActions';
import { useCooldownTick } from './hooks/useCooldownTick';
import { useSimulationInviteModal } from './hooks/useSimulationInviteModal';
import { useSimulationLabels } from './hooks/useSimulationLabels';
import { __testables } from './simulationDetailTestables';
import { logSimulationDetailEvent } from './utils/events';
import { scenarioVersionLabel } from './utils/detail';

function buildActionError(
  message: string | null | undefined,
  fallback: string,
) {
  const safe = typeof message === 'string' ? message.trim() : '';
  return safe || fallback;
}

export default function SimulationDetailContainer() {
  const simulationId = useParams<{ id: string }>().id;
  const { notify } = useNotifications();
  const {
    detail,
    plan,
    loading: planLoading,
    error: planError,
    statusCode: planStatusCode,
    isGenerating,
    reload: reloadPlan,
  } = useSimulationPlan({ simulationId });
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [retryGenerateLoading, setRetryGenerateLoading] = useState(false);
  const [terminatePending, setTerminatePending] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminateBlockedStatus, setTerminateBlockedStatus] = useState<
    403 | 404 | null
  >(null);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [cleanupJobIds, setCleanupJobIds] = useState<string[]>([]);

  useEffect(() => {
    setActionError(null);
    setTerminatePending(false);
    setTerminateModalOpen(false);
    setTerminateBlockedStatus(null);
    setStatusOverride(null);
    setCleanupJobIds([]);
  }, [simulationId]);

  const simulationStatus =
    statusOverride ?? detail?.status ?? detail?.statusRaw ?? null;
  const isTerminated = simulationStatus === 'terminated';
  const inviteEnabled = simulationStatus === 'active_inviting' && !isTerminated;
  const inviteDisabledReason = inviteEnabled
    ? null
    : isTerminated
      ? 'This simulation has been terminated. Invites are disabled immediately.'
      : 'Invites stay disabled until the simulation is active inviting.';
  const inviteResendEnabled = !isTerminated;
  const inviteResendDisabledReason = inviteResendEnabled
    ? null
    : 'This simulation has been terminated. Invites and resends are disabled.';

  const pageBlocked =
    terminateBlockedStatus != null ||
    planStatusCode === 403 ||
    planStatusCode === 404;
  const blockedStatusCode =
    terminateBlockedStatus ??
    (planStatusCode === 403 || planStatusCode === 404
      ? (planStatusCode as 403 | 404)
      : null);
  const candidatesEnabled =
    !pageBlocked && (detail != null || planStatusCode != null || !planLoading);
  const { candidates, loading, error, reload, setCandidates } =
    useSimulationCandidates({ simulationId, enabled: candidatesEnabled });
  const search = useCandidatesSearch({ candidates, pageSize: 25 });
  const { rowStates, handleCopy, handleResend, closeManualCopy } =
    useCandidateRowActions(
      simulationId,
      reload,
      setCandidates,
      inviteResendEnabled,
      inviteResendDisabledReason,
    );
  const inviteModal = useSimulationInviteModal({
    simulationId,
    reloadCandidates: reload,
  });
  const closeInviteModal = inviteModal.close;
  const submitInvite = inviteModal.submitInvite;
  const cooldownTick = useCooldownTick(rowStates);
  const labels = useSimulationLabels(plan, detail, simulationId);

  const scenarioVersionIndex = detail?.scenarioVersion.versionIndex ?? null;
  const canApprove = simulationStatus === 'ready_for_review';

  const scenarioFailureMessage = useMemo(() => {
    if (!detail?.hasJobFailure) return null;
    return (
      detail.generationJob?.errorMessage ??
      'Scenario generation failed. Retry generation to continue.'
    );
  }, [detail]);

  const scenarioFailureCode = detail?.generationJob?.errorCode ?? null;

  const refreshPlan = useCallback(async () => {
    await reloadPlan();
  }, [reloadPlan]);

  const onApprove = useCallback(async () => {
    if (!canApprove || approveLoading) return;

    setActionError(null);
    setApproveLoading(true);
    logSimulationDetailEvent('approve_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: scenarioVersionIndex,
    });

    try {
      const result = await activateSimulationInviting(simulationId);
      if (!result.ok) {
        setActionError(
          buildActionError(
            result.message,
            'Unable to activate inviting for this simulation.',
          ),
        );
        return;
      }
      await refreshPlan();
    } catch (caught: unknown) {
      setActionError(
        buildActionError(
          toUserMessage(
            caught,
            'Unable to activate inviting for this simulation.',
            {
              includeDetail: false,
            },
          ),
          'Unable to activate inviting for this simulation.',
        ),
      );
    } finally {
      setApproveLoading(false);
    }
  }, [
    approveLoading,
    canApprove,
    refreshPlan,
    scenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onRegenerate = useCallback(async () => {
    if (regenerateLoading) return;

    const lockedAt = detail?.scenarioVersion.lockedAt;
    if (lockedAt) {
      const proceed = window.confirm(
        'This scenario version is locked. Regenerating will create a new version. Continue?',
      );
      if (!proceed) return;
    }

    setActionError(null);
    setRegenerateLoading(true);
    logSimulationDetailEvent('regenerate_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: scenarioVersionIndex,
    });

    try {
      const result = await regenerateSimulationScenario(simulationId);
      if (!result.ok) {
        setActionError(
          buildActionError(result.message, 'Unable to regenerate scenario.'),
        );
        return;
      }
      await refreshPlan();
    } catch (caught: unknown) {
      setActionError(
        buildActionError(
          toUserMessage(caught, 'Unable to regenerate scenario.', {
            includeDetail: false,
          }),
          'Unable to regenerate scenario.',
        ),
      );
    } finally {
      setRegenerateLoading(false);
    }
  }, [
    detail?.scenarioVersion.lockedAt,
    refreshPlan,
    regenerateLoading,
    scenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onRetryGenerate = useCallback(async () => {
    if (retryGenerateLoading) return;

    setActionError(null);
    setRetryGenerateLoading(true);
    logSimulationDetailEvent('retry_generate_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: scenarioVersionIndex,
    });

    try {
      const result = await retrySimulationGeneration(simulationId);
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
  }, [
    refreshPlan,
    retryGenerateLoading,
    scenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onSubmitInvite = useCallback(
    async (candidateName: string, inviteEmail: string) => {
      if (isTerminated) {
        const message =
          inviteDisabledReason ??
          'This simulation has been terminated. Invites are disabled immediately.';
        setActionError(message);
        notify({
          id: `invite-disabled-${simulationId}`,
          tone: 'error',
          title: 'Invites are disabled',
          description: message,
        });
        closeInviteModal();
        return;
      }

      await submitInvite(candidateName, inviteEmail);
    },
    [
      closeInviteModal,
      inviteDisabledReason,
      isTerminated,
      notify,
      simulationId,
      submitInvite,
    ],
  );

  const onSetTerminateModalOpen = useCallback(
    (open: boolean) => {
      if (open && !terminateModalOpen) {
        logSimulationDetailEvent('terminate_clicked', {
          simulationId,
          status: simulationStatus,
          scenarioVersion: scenarioVersionIndex,
        });
      }
      setTerminateModalOpen(open);
    },
    [
      scenarioVersionIndex,
      simulationId,
      simulationStatus,
      terminateModalOpen,
      setTerminateModalOpen,
    ],
  );

  const onTerminate = useCallback(async () => {
    if (terminatePending) return;

    setActionError(null);
    setTerminatePending(true);
    logSimulationDetailEvent('terminate_confirmed', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: scenarioVersionIndex,
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
        logSimulationDetailEvent('terminate_success', {
          simulationId,
          status: 'terminated',
          scenarioVersion: scenarioVersionIndex,
        });
        return;
      }

      if (result.statusCode === 403 || result.statusCode === 404) {
        setTerminateModalOpen(false);
        setTerminateBlockedStatus(result.statusCode);
        logSimulationDetailEvent('terminate_failure', {
          simulationId,
          status: simulationStatus,
          scenarioVersion: scenarioVersionIndex,
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
      logSimulationDetailEvent('terminate_failure', {
        simulationId,
        status: simulationStatus,
        scenarioVersion: scenarioVersionIndex,
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
      logSimulationDetailEvent('terminate_failure', {
        simulationId,
        status: simulationStatus,
        scenarioVersion: scenarioVersionIndex,
      });
    } finally {
      setTerminatePending(false);
    }
  }, [
    closeInviteModal,
    notify,
    scenarioVersionIndex,
    simulationId,
    simulationStatus,
    terminatePending,
  ]);

  if (pageBlocked && blockedStatusCode) {
    return <SimulationDetailBlockedState statusCode={blockedStatusCode} />;
  }

  return (
    <SimulationDetailView
      simulationId={simulationId}
      simulationStatus={simulationStatus}
      scenarioVersionLabel={scenarioVersionLabel(scenarioVersionIndex)}
      scenarioIdLabel={detail?.scenarioVersion.id ?? null}
      scenarioLocked={detail?.scenarioVersion.isLocked ?? false}
      scenarioLockedAt={detail?.scenarioVersion.lockedAt ?? null}
      inviteEnabled={inviteEnabled}
      inviteDisabledReason={inviteDisabledReason}
      inviteResendEnabled={inviteResendEnabled}
      inviteResendDisabledReason={inviteResendDisabledReason}
      actionError={actionError}
      canApprove={canApprove}
      approveLoading={approveLoading}
      onApprove={onApprove}
      regenerateLoading={regenerateLoading}
      onRegenerate={onRegenerate}
      terminatePending={terminatePending}
      terminateModalOpen={terminateModalOpen}
      setTerminateModalOpen={onSetTerminateModalOpen}
      onTerminate={onTerminate}
      cleanupJobIds={cleanupJobIds}
      retryGenerateLoading={retryGenerateLoading}
      onRetryGenerate={onRetryGenerate}
      templateKeyLabel={labels.templateKeyLabel}
      titleLabel={labels.titleLabel}
      roleLabel={labels.roleLabel}
      stackLabel={labels.stackLabel}
      levelLabel={labels.levelLabel}
      focusLabel={labels.focusLabel}
      companyContextLabel={labels.companyContextLabel}
      scenarioLabel={labels.scenarioLabel}
      rubricSummary={labels.rubricSummary}
      planDays={labels.planDays}
      planLoading={planLoading}
      planStatusCode={planStatusCode}
      generating={isGenerating}
      jobFailureMessage={scenarioFailureMessage}
      jobFailureCode={scenarioFailureCode}
      planError={planError}
      reloadPlan={reloadPlan}
      candidates={candidates}
      candidatesLoading={loading}
      candidatesError={error}
      reloadCandidates={reload}
      search={search}
      rowStates={rowStates}
      onCopy={handleCopy}
      onResend={handleResend}
      onCloseManual={closeManualCopy}
      cooldownNow={cooldownTick}
      inviteModalOpen={inviteModal.open}
      setInviteModalOpen={inviteModal.setOpen}
      inviteFlowState={inviteModal.inviteFlowState}
      submitInvite={onSubmitInvite}
      resetInviteFlow={inviteModal.resetInviteFlow}
    />
  );
}

export { __testables };
