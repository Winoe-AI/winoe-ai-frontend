import type { SimulationDetailViewProps } from '../components/types';
import type { useSimulationLabels } from '../hooks/useSimulationLabels';
import type { useSimulationDetailCandidates } from './hooks/useSimulationDetailCandidates';
import type { useSimulationScenarioActions } from './hooks/useSimulationScenarioActions';
import type { useSimulationScenarioVersions } from './hooks/useSimulationScenarioVersions';
import { buildSimulationDetailCandidateProps } from './buildSimulationDetailCandidateProps';
import { buildSimulationDetailScenarioProps } from './buildSimulationDetailScenarioProps';

type BuildSimulationDetailViewPropsArgs = {
  simulationId: string;
  simulationStatus: string | null;
  actionError: string | null;
  terminatePending: boolean;
  terminateModalOpen: boolean;
  setTerminateModalOpen: (open: boolean) => void;
  onTerminate: () => Promise<void>;
  cleanupJobIds: string[];
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  scenario: ReturnType<typeof useSimulationScenarioVersions>;
  scenarioActions: ReturnType<typeof useSimulationScenarioActions>;
  labels: ReturnType<typeof useSimulationLabels>;
  approveButtonLabel: string;
  planLoading: boolean;
  planStatusCode: number | null;
  isGenerating: boolean;
  planError: string | null;
  reloadPlan: () => Promise<void>;
  candidatesModel: ReturnType<typeof useSimulationDetailCandidates>;
  onSubmitInvite: (name: string, email: string) => Promise<void>;
};

export function buildSimulationDetailViewProps({
  simulationId,
  simulationStatus,
  actionError,
  terminatePending,
  terminateModalOpen,
  setTerminateModalOpen,
  onTerminate,
  cleanupJobIds,
  inviteEnabled,
  inviteDisabledReason,
  inviteResendEnabled,
  inviteResendDisabledReason,
  scenario,
  scenarioActions,
  labels,
  approveButtonLabel,
  planLoading,
  planStatusCode,
  isGenerating,
  planError,
  reloadPlan,
  candidatesModel,
  onSubmitInvite,
}: BuildSimulationDetailViewPropsArgs): SimulationDetailViewProps {
  const scenarioProps = buildSimulationDetailScenarioProps({
    scenario,
    scenarioActions,
    labels,
    approveButtonLabel,
    planLoading,
    planStatusCode,
    isGenerating,
    planError,
    reloadPlan,
  });

  const candidateProps = buildSimulationDetailCandidateProps({
    inviteEnabled,
    inviteDisabledReason,
    inviteResendEnabled,
    inviteResendDisabledReason,
    candidatesModel,
    onSubmitInvite,
  });

  return {
    simulationId,
    simulationStatus,
    actionError,
    terminatePending,
    terminateModalOpen,
    setTerminateModalOpen,
    onTerminate,
    cleanupJobIds,
    ...scenarioProps,
    ...candidateProps,
  };
}
