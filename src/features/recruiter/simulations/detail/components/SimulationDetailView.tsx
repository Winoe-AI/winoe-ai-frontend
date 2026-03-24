'use client';
import { useEffect, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { ScenarioControlsSectionProps } from './ScenarioControlsSection';
import { CandidatesSection } from './sections/CandidatesSection';
import { SimulationPlanSection } from './SimulationPlanSection';
import { SimulationDetailHeader } from './SimulationDetailHeader';
import { useInviteModalActions } from './InviteModalActions';
import { TerminateSimulationModal } from './TerminateSimulationModal';
import { CleanupInProgressPanel } from './CleanupInProgressPanel';
import type { SimulationDetailViewProps } from './types';

const LazyScenarioControlsSection = dynamic<ScenarioControlsSectionProps>(
  () =>
    import('./ScenarioControlsSection').then(
      (mod) => mod.ScenarioControlsSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">
          Loading scenario controls...
        </div>
      </div>
    ),
  },
);

let ScenarioControlsSectionComponent: ComponentType<ScenarioControlsSectionProps> =
  LazyScenarioControlsSection;

if (process.env.NODE_ENV === 'test') {
  const scenarioControlsModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./ScenarioControlsSection') as typeof import('./ScenarioControlsSection');
  ScenarioControlsSectionComponent =
    scenarioControlsModule.ScenarioControlsSection;
}

const DEFERRED_SCENARIO_CONTROLS_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : 450;

type WindowWithIdleCallbacks = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const SimulationInviteModal = dynamic(
  () =>
    import('./SimulationInviteModal').then((mod) => mod.SimulationInviteModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
        <div className="rounded bg-white px-4 py-3 text-sm text-gray-700 shadow">
          Loading invite form…
        </div>
      </div>
    ),
  },
);

export function SimulationDetailView(props: SimulationDetailViewProps) {
  const { openInviteModal, closeInviteModal } = useInviteModalActions({
    inviteEnabled: props.inviteEnabled,
    resetInviteFlow: props.resetInviteFlow,
    setInviteModalOpen: props.setInviteModalOpen,
  });
  const [showScenarioControls, setShowScenarioControls] = useState(
    DEFERRED_SCENARIO_CONTROLS_DELAY_MS === 0,
  );

  useEffect(() => {
    if (DEFERRED_SCENARIO_CONTROLS_DELAY_MS === 0 || showScenarioControls) {
      return;
    }
    let idleId: number | null = null;

    const timer = window.setTimeout(() => {
      const hostWindow = window as WindowWithIdleCallbacks;
      if (typeof hostWindow.requestIdleCallback === 'function') {
        idleId = hostWindow.requestIdleCallback(
          () => setShowScenarioControls(true),
          { timeout: 900 },
        );
        return;
      }
      setShowScenarioControls(true);
    }, DEFERRED_SCENARIO_CONTROLS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== null) {
        (window as WindowWithIdleCallbacks).cancelIdleCallback?.(idleId);
      }
    };
  }, [showScenarioControls]);

  return (
    <div className="flex flex-col gap-4 py-8">
      <SimulationDetailHeader
        simulationId={props.simulationId}
        simulationStatus={props.simulationStatus}
        selectedScenarioStatusForDisplay={
          props.selectedScenarioStatusForDisplay
        }
        scenarioVersionLabel={props.scenarioVersionLabel}
        scenarioIdLabel={props.scenarioIdLabel}
        scenarioLocked={props.scenarioLocked}
        scenarioLockedAt={props.scenarioLockedAt}
        titleLabel={props.titleLabel}
        templateKeyLabel={props.templateKeyLabel}
        inviteEnabled={props.inviteEnabled}
        inviteDisabledReason={props.inviteDisabledReason}
        canApprove={props.canApprove}
        approveButtonLabel={props.approveButtonLabel}
        approveLoading={props.approveLoading}
        onApprove={props.onApprove}
        regenerateLoading={props.regenerateLoading}
        regenerateDisabled={props.regenerateDisabled}
        onRegenerate={props.onRegenerate}
        terminatePending={props.terminatePending}
        onOpenTerminateModal={() => props.setTerminateModalOpen(true)}
        onInvite={openInviteModal}
      />
      <CleanupInProgressPanel cleanupJobIds={props.cleanupJobIds} />
      {showScenarioControls ? (
        <ScenarioControlsSectionComponent
          versions={props.scenarioVersions}
          selectedVersionId={props.selectedScenarioVersionId}
          onSelectVersion={props.onSelectScenarioVersion}
          selectedVersion={props.selectedScenarioVersion}
          previousVersion={props.previousScenarioVersion}
          lockBannerMessage={props.scenarioLockBannerMessage}
          contentUnavailableMessage={props.scenarioContentUnavailableMessage}
          generatingLabel={props.scenarioGeneratingLabel}
          editorDisabled={props.scenarioEditorDisabled}
          editorDisabledReason={props.scenarioEditorDisabledReason}
          editorSaving={props.scenarioEditorSaving}
          editorSaveError={props.scenarioEditorSaveError}
          editorFieldErrors={props.scenarioEditorFieldErrors}
          editorDraft={props.scenarioEditorDraft}
          onEditorDraftChange={props.onScenarioEditorDraftChange}
          onSave={props.onSaveScenarioEdits}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">
            Preparing scenario controls...
          </div>
        </div>
      )}
      <SimulationPlanSection
        status={props.selectedScenarioStatusForDisplay}
        scenarioVersionLabel={props.scenarioVersionLabel}
        scenarioIdLabel={props.scenarioIdLabel}
        scenarioLocked={props.scenarioLocked}
        templateKeyLabel={props.templateKeyLabel}
        roleLabel={props.roleLabel}
        stackLabel={props.stackLabel}
        levelLabel={props.levelLabel}
        focusLabel={props.focusLabel}
        companyContextLabel={props.companyContextLabel}
        scenarioLabel={props.scenarioLabel}
        rubricSummary={props.rubricSummary}
        contentUnavailableMessage={
          props.scenarioContentUnavailableMessageForPlan
        }
        planDays={props.planDays}
        loading={props.planLoading}
        statusCode={props.planStatusCode}
        generating={props.generating}
        actionError={props.actionError}
        retryGenerateLoading={props.retryGenerateLoading}
        onRetryGenerate={props.onRetryGenerate}
        jobFailureMessage={props.jobFailureMessage}
        jobFailureCode={props.jobFailureCode}
        error={props.planError}
        onRetry={props.reloadPlan}
      />
      <CandidatesSection
        loading={props.candidatesLoading}
        error={props.candidatesError}
        onRetry={props.reloadCandidates}
        search={props.search}
        candidates={props.candidates}
        rowStates={props.rowStates}
        onCopy={props.onCopy}
        onResend={props.onResend}
        onCloseManual={props.onCloseManual}
        cooldownNow={props.cooldownNow}
        simulationId={props.simulationId}
        inviteEnabled={props.inviteEnabled}
        inviteDisabledReason={props.inviteDisabledReason}
        onInvite={openInviteModal}
        inviteResendEnabled={props.inviteResendEnabled}
        inviteResendDisabledReason={props.inviteResendDisabledReason}
      />

      {props.inviteModalOpen ? (
        <SimulationInviteModal
          simulationId={props.simulationId}
          open={props.inviteModalOpen}
          inviteFlowState={props.inviteFlowState}
          onClose={closeInviteModal}
          onSubmit={props.submitInvite}
        />
      ) : null}

      {props.terminateModalOpen ? (
        <TerminateSimulationModal
          open={props.terminateModalOpen}
          pending={props.terminatePending}
          onClose={() => props.setTerminateModalOpen(false)}
          onConfirm={props.onTerminate}
        />
      ) : null}
    </div>
  );
}
