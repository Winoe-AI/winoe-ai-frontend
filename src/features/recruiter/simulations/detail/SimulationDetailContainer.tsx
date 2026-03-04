'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  activateSimulationInviting,
  regenerateSimulationScenario,
  retrySimulationGeneration,
} from '@/features/recruiter/api';
import { toUserMessage } from '@/lib/errors/errors';
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
  const {
    detail,
    plan,
    loading: planLoading,
    error: planError,
    statusCode: planStatusCode,
    isGenerating,
    reload: reloadPlan,
  } = useSimulationPlan({ simulationId });
  const pageBlocked = planStatusCode === 403 || planStatusCode === 404;
  const candidatesEnabled =
    !pageBlocked && (detail != null || planStatusCode != null || !planLoading);
  const { candidates, loading, error, reload, setCandidates } =
    useSimulationCandidates({ simulationId, enabled: candidatesEnabled });
  const search = useCandidatesSearch({ candidates, pageSize: 25 });
  const { rowStates, handleCopy, handleResend, closeManualCopy } =
    useCandidateRowActions(simulationId, reload, setCandidates);
  const inviteModal = useSimulationInviteModal({
    simulationId,
    reloadCandidates: reload,
  });
  const cooldownTick = useCooldownTick(rowStates);
  const labels = useSimulationLabels(plan, detail, simulationId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [retryGenerateLoading, setRetryGenerateLoading] = useState(false);

  const simulationStatus = detail?.status ?? detail?.statusRaw ?? null;
  const inviteEnabled = simulationStatus === 'active_inviting';
  const inviteDisabledReason = inviteEnabled
    ? null
    : 'Invites stay disabled until the simulation is active inviting.';

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

  if (pageBlocked) {
    return (
      <SimulationDetailBlockedState statusCode={planStatusCode as 403 | 404} />
    );
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
      actionError={actionError}
      canApprove={canApprove}
      approveLoading={approveLoading}
      onApprove={onApprove}
      regenerateLoading={regenerateLoading}
      onRegenerate={onRegenerate}
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
      submitInvite={inviteModal.submitInvite}
      resetInviteFlow={inviteModal.resetInviteFlow}
    />
  );
}

export { __testables };
